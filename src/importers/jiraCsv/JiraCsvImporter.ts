import { Comment, Importer, ImportResult } from '../../types';
const csv = require('csvtojson');
const j2m = require('jira2md');

type JiraPriority = 'Highest' | 'High' | 'Medium' | 'Low' | 'Lowest';

interface JiraIssueType {
  Description: string;
  Status: string;
  'Issue key': string;
  'Issue Type': string;
  Priority: JiraPriority;
  'Project key': string;
  Summary: string;
  Assignee: string;
  Reporter: string;
  Creator: string;
  Created: string;
  Release: string;
  'Custom field (Story Points)'?: string;
  'Custom field (Epic Link)'?: string;
  Attachment: any;
  Comment: any;
}

interface HeaderResult {
  HeaderChanged: boolean;
  NewHeader: string[];
  error: object | null;
}

interface labelColor {
  [id: string]: {
    name: string;
    color?: string;
    description?: string;
  };
}

/**
 * Import issues from a Jira CSV export.
 *
 * @param apiKey GitHub api key for authentication
 */
export class JiraCsvImporter implements Importer {
  public constructor(
    filePath: string,
    orgSlug: string,
    includeIssueKeyInTheTitle: boolean
  ) {
    this.filePath = filePath;
    this.organizationName = orgSlug;
    this.includeIssueKeyInTheTitle = includeIssueKeyInTheTitle;
  }

  public get name() {
    return 'Jira (CSV)';
  }

  public get defaultTeamName() {
    return 'Jira';
  }

  /**
   * Check csv file header and if multiple columns with same header name is found, change header into [headerName].[numericIndexFromZero] format
   * i.e. attachment, attachment, attachment => attachment.0, attachment.1, attachment.2
   * Assumption: same name headers are grouped together
   * @returns {Promise<HeaderResult>}
   */
  public checkHeader = (): Promise<HeaderResult> => {
    const newHeader: HeaderResult = {
      HeaderChanged: false,
      NewHeader: [],
      error: null,
    };

    return new Promise(resolve => {
      csv()
        .on('header', (header: string[]) => {
          const numDistinctColumns = header.filter(
            (val, idx, self) => self.indexOf(val) === idx
          ).length;
          if (numDistinctColumns !== header.length) {
            let prevHd: string = '';
            let headerCounter: number = 0;
            newHeader.HeaderChanged = true;

            prevHd = header[0];
            newHeader.NewHeader[0] = prevHd;
            for (let index = 1; index < header.length; index++) {
              const hd = header[index];
              if (hd === prevHd) {
                if (headerCounter === 0) {
                  newHeader.NewHeader[index - 1] = `${hd}.${headerCounter++}`;
                  newHeader.NewHeader[index] = `${hd}.${headerCounter++}`;
                } else {
                  newHeader.NewHeader[index] = `${hd}.${headerCounter++}`;
                }
              } else {
                prevHd = hd;
                headerCounter = 0;
                newHeader.NewHeader[index] = hd;
              }
            }
          }
          resolve(newHeader);
        })
        .on('error', (err: any) => {
          newHeader.error = err;
          resolve(newHeader);
        })
        .fromFile(this.filePath);
    });
  };

  public import = async (): Promise<ImportResult> => {
    const labelColors: labelColor = {
      Task: {
        name: 'Task',
        color: '#4dafe4',
      },
      'Sub-task': {
        name: 'Sub-task',
        color: '#4dafe4',
      },
      Story: {
        name: 'Story',
        color: '#68b74a',
      },
      Bug: {
        name: 'Bug',
        color: '#e24b42',
      },
      Epic: {
        name: 'Epic',
        color: '#8c5adc',
      },
    };

    const importData: ImportResult = {
      issues: [],
      labels: {},
      users: {},
      statuses: {},
    };

    const newHeader = (await this.checkHeader()) as HeaderResult;
    const csvOptions = {
      noheader: false,
      headers: (newHeader.HeaderChanged && newHeader.NewHeader) || null,
    };

    if (newHeader.error !== null) {
      return importData;
    }

    const data = (await csv(csvOptions).fromFile(
      this.filePath
    )) as JiraIssueType[];

    const statuses = Array.from(new Set(data.map(row => row['Status'])));
    const assignees = [
      ...Array.from(new Set(data.map(row => row['Assignee']))),
      ...Array.from(new Set(data.map(row => row['Reporter']))),
      ...Array.from(new Set(data.map(row => row['Creator']))),
    ];

    const baseUrl = this.organizationName
      ? `https://${this.organizationName}.atlassian.net/browse`
      : undefined;

    for (const user of assignees) {
      if (user) {
        importData.users[user] = {
          name: user,
        };
      }
    }
    for (const status of statuses) {
      importData.statuses![status] = {
        name: status,
      };
    }

    for (const row of data) {
      let mdDesc: string = j2m.to_markdown(row['Description']);

      // add attachment links to description
      let jiraAttachments = row.Attachment || [];
      if (jiraAttachments && typeof jiraAttachments === 'string') {
        jiraAttachments = [jiraAttachments];
      }
      if (jiraAttachments.length) {
        mdDesc += `${mdDesc && '\n\n'}Attachment(s):`;
      }
      jiraAttachments.forEach((att: string) => {
        if (att) {
          const [, userId, linkName, linkUrl] = att.split(';');
          mdDesc += `\n[${linkName}](${linkUrl})`;
          if (!importData.users[userId]) {
            importData.users[userId] = {
              name: userId,
            };
          }
        }
      });

      // put epic link
      mdDesc +=
        row['Custom field (Epic Link)'] && baseUrl
          ? `${mdDesc && '\n\n'}[View epic link in Jira \[${
              row['Custom field (Epic Link)']
            }\]](${baseUrl}/${row['Custom field (Epic Link)']})`
          : '';

      // put jira issue link
      const url = baseUrl ? `${baseUrl}/${row['Issue key']}` : undefined;
      const description = url
        ? `${mdDesc}${mdDesc && '\n\n'}[View original issue in Jira \[${
            row['Issue key']
          }\]](${url})`
        : mdDesc;

      const title = this.includeIssueKeyInTheTitle
        ? `\[${row['Issue key']}\] ${row['Summary']}`
        : row['Summary'];

      const priority = mapPriority(row['Priority']);
      const type = row['Issue Type'];
      const release =
        row['Release'] && row['Release'].length > 0
          ? `Release: ${row['Release']}`
          : undefined;
      const assigneeId =
        row['Assignee'] && row['Assignee'].length > 0
          ? row['Assignee']
          : undefined;
      const status = row['Status'];

      const labels = [type];

      // comments
      const comments: Comment[] = [];
      let jiraComments = row.Comment || [];
      if (jiraComments && typeof jiraComments === 'string') {
        jiraComments = [jiraComments];
      }
      const validComments = jiraComments.filter((cm: string) => !!cm);
      validComments.forEach((cm: string) => {
        const commentChunks = cm.split(';');
        const [createdAt, userId, ...body] = commentChunks;
        const commentBody = body.join(';');
        comments.push({
          body: commentBody,
          userId,
          createdAt: new Date(createdAt),
        });
        if (!importData.users[userId]) {
          importData.users[userId] = {
            name: userId,
          };
        }
      });

      if (release) {
        labels.push(release);
      }

      importData.issues.push({
        title,
        description,
        status,
        priority,
        url,
        assigneeId,
        labels,
        comments,
      });

      for (const lab of labels) {
        if (!importData.labels[lab]) {
          const color = labelColors[lab];
          importData.labels[lab] = {
            name: lab,
            color: color.color,
          };
        }
      }
    }

    return importData;
  };

  // -- Private interface

  private filePath: string;
  private organizationName?: string;
  private includeIssueKeyInTheTitle?: boolean;
}

const mapPriority = (input: JiraPriority): number => {
  const priorityMap = {
    Highest: 1,
    High: 2,
    Medium: 3,
    Low: 4,
    Lowest: 0,
  };
  return priorityMap[input] || 0;
};
