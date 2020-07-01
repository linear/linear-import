# linear-import

Install the CLI:

```
yarn global add linear-import # or npm i -g linear-import
```

Run interactive importer:

```
linear-import
```

## Importers

It's recommended to only import open issues to keep your Linear account more manageable.

### GitHub

Open GitHub issues can be imported with your personal access token from GitHub's API.

Supported fields:

- Title
- Description
- Labels
- (Optional) Comments

### Jira CSV

Jira project can be imported into a Linear team from the CSV export file.

Following fields are supported:

- `Summary` - Issue title
- `Description` - Converted into markdown and used as issue description
- `Priority` - Issue priority
- `Issue Type` - Added as a label
- (Optional) `Release` - Added as a label

### Asana CSV

Asana projects can be imported into a Linear team from the CSV export file.

Following fields are supported:

- `Name` - Issue title
- `Notes` - Converted into markdown and used as issue description
- `Priority` - Issue priority
- `Tags` - Added as a label
- `Assignee` - Issue assignee

### Pivotal Tracker CSV

Pivotal Tracker projects can be imported into a Linear team from the CSV export file. It only imports `chores`, `features`, and `bugs`.

Following fields are supported:

- `Title` - Issue title
- `Description` - Converted into markdown and used as issue description
- `Estimate` - Estimate of story
- `Labels` - Added as a label
- `Owned By` - Story owner
- `URL` - URL of Pivotal Tracker story
- `Created at` - Preserves the story creation date

## Todo

- [x] Automatic image uploads
- [ ] Publish to NPM
- [ ] Assignees (pick from a list)
- [ ] Created at (requires API change)
