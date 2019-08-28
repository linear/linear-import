# linear-import

Run interactive importer:

```
yarn cli
```

## Importers

It's recommended to only import open issues to keep your Linear account more manageable.

### GitHub

Open GitHub issues can be imported with your personal access token from GitHub's API.

Supported fields:

- Title
- Description
- Created at
- Labels
- (Optional) Comments

### Jira CSV

Jira project can be imported into a Linear team from the CSV export file.

Following fields are supported:

- `Summary` - Issue title
- `Description` - Converted into markdown and used as issue description
- `Priority` - Issue priority
- `Status` - Converted into Linear's open status
- `Issue Type` - Added as a label
- (Optional) `Assignee` - You can map an assignee as a Linear user
- (Optional) `Release` - Added as a label
