# QuickPass

## MongoDB Atlas

The backend uses whatever database name is included in `MONGODB_URI`.

For this project, use `campus_quickpass` in the connection string, for example:

```text
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/campus_quickpass?retryWrites=true&w=majority
```

Set that exact URI in Render under `MONGODB_URI`, then redeploy the API.