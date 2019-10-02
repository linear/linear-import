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

## Todo

- [x] Automatic image uploads
- [ ] Assignees (pick from a list)
- [ ] Created at (requires API change)
