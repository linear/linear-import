import { Importer, ImportResult } from '../../types';
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
  Created: string;
  Release: string;
  'Custom field (Story Points)'?: string;
}

/**
 * Import issues from a Jira CSV export.
 *
 * @param apiKey GitHub api key for authentication
 */
export class JiraCsvImporter implements Importer {
  public constructor(filePath: string) {
    this.filePath = filePath;
    // this.organizationName =
  }

  public get name() {
    return 'Jira (CSV)';
  }

  public get defaultTeamName() {
    return 'Jira'; // TODO
  }

  public import = async (): Promise<ImportResult> => {
    const data = (await csv().fromFile(this.filePath)) as JiraIssueType[];

    const importData: ImportResult = {
      issues: [],
      labels: {},
      users: {},
    };

    const statuses = Array.from(new Set(data.map(row => row['Status'])));
    statuses;
    // TODO handle statuses

    for (const row of data) {
      // todo
      const type = row['Issue Type'];
      importData.issues.push({
        title: row['Summary'],
        description: j2m.to_markdown(row['Description']),
        priority: mapPriority(row['Priority']),
        url: this.organizationName
          ? `https://${this.organizationName}.atlassian.net/browse/${row['Issue key']}`
          : undefined,
        labels: [type],
      });

      if (!importData.labels[type]) {
        importData.labels[type] = {
          name: type,
          // add color?
        };
      }
    }

    // for (const issue of issueData) {
    //   importData.issues.push({
    //     title: issue.title,
    //     description: `${issue.body}\n\n[View original issue on GitHub](${issue.url})`,
    //     url: issue.url,
    //     comments: issue.comments.nodes
    //       ? issue.comments.nodes
    //           .filter(comment => comment.author.id)
    //           .map(comment => ({
    //             body: comment.body,
    //             userId: comment.author.id as string,
    //             createdAt: new Date(comment.createdAt),
    //           }))
    //       : [],
    //     labels: issue.labels.nodes
    //       ? issue.labels.nodes.map(label => label.id)
    //       : [],
    //     createdAt: new Date(issue.createdAt),
    //   });

    //   const users = issue.comments.nodes
    //     ? issue.comments.nodes.map(comment => ({
    //         id: comment.author.id,
    //         name: comment.author.login,
    //         avatarUrl: comment.author.avatarUrl,
    //         email: comment.author.email,
    //       }))
    //     : [];
    //   for (const user of users) {
    //     const { id, email, ...userData } = user;
    //     if (id) {
    //       importData.users[id] = {
    //         ...userData,
    //         email: email && email.length > 0 ? email : undefined,
    //       };
    //     }
    //   }

    //   const labels = issue.labels.nodes
    //     ? issue.labels.nodes.map(label => ({
    //         id: label.id,
    //         color: `#${label.color}`,
    //         name: label.name,
    //         description: label.description,
    //       }))
    //     : [];
    //   for (const label of labels) {
    //     const { id, ...labelData } = label;
    //     importData.labels[id] = labelData;
    //   }
    // }

    return importData;
  };

  // -- Private interface

  private filePath: string;
  private organizationName?: string;
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
