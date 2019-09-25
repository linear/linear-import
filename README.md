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
- `Attachemnts` - Added as a link on description
- (Optional) `Release` - Added as a label
- (Optional) `Issue key` - Added to the title as a prefix
- (Optional) `Comments`

## Todo

- [X] Automatic image uploads
- [ ] Assignees (pick from a list)
- [ ] Created at (requires API change)
