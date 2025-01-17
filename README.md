
# ImportJSON for Atlassian Cloud

This repository contains a custom Google Apps Script that extends the `ImportJSON` function to support Atlassian Cloud APIs (e.g., Jira Cloud, Confluence Cloud). By storing your Atlassian Cloud URL, email, and API token in Script Properties, you can easily import JSON data into a Google Sheet without exposing credentials in plain text.

---

## Overview

- **Language:** Google Apps Script (JavaScript).
- **Purpose:** Retrieve JSON from Atlassian Cloud APIs using Basic Auth with API tokens.
- **Key Functions:** 
  - `ImportJSONAdvanced(url, query, options, email, token)`  
  - `ImportJSON(url, query, options, email, token)`  
  - Both can leverage script properties to avoid hard-coding credentials.

**Live Example Sheet:** [Google Sheet with Script Attached](https://docs.google.com/spreadsheets/d/1Fsi-JKr0hd5WeFUTE_1ov55l1pET9Kg8_BCtvX3_dRE/edit?usp=sharing)

---

## Getting Started

1. **Open the Google Sheet**  
   - Use the link above or make a copy of the sheet containing the script.
   - Alternatively, you can copy the code from this repository into a new Apps Script project attached to your own Google Sheet.

2. **Access the Script Editor**  
   - In the Sheet, go to **Extensions** → **Apps Script**.
   - This opens the Apps Script editor, where you can view/edit the `ImportJSON.gs` file.

3. **Set Script Properties**  
   In the Apps Script editor:
   1. Click the gear icon (Project Settings) on the left or use the menu: **Project** → **Project Properties**.
   2. Locate **Script Properties** and click **Open Script Properties**.
   3. Create properties for:
      - `url` – Your Atlassian Cloud URL, e.g. `https://your-domain.atlassian.net/`.
      - `email` – The email you use for Atlassian Cloud.
      - `token` – Your Atlassian API token (generated from <https://id.atlassian.com/manage/api-tokens>).

   **Example:**
   ```
   url = https://your-domain.atlassian.net/
   email = me@mydomain.com
   token = abc123generatedapitoken
   ```

4. **Confirm the Script is Available**  
   - In the script code, ensure you see the `ImportJSON` and `ImportJSONAdvanced` functions.  
   - Feel free to run a test function or open the logs (`View` → `Logs`) to confirm the code is active.

---

## Usage in the Spreadsheet

### Option A: Directly pass all parameters
```none
=ImportJSONAdvanced(
  "https://your-domain.atlassian.net/rest/api/3/search?jql=project=MYPROJ",
  "/issues",
  "noHeaders",
  "your.email@company.com",
  "yourApiToken"
)
```
- **URL**: The Atlassian REST endpoint (Jira, Confluence, etc.).  
- **Query**: Paths to import from the JSON.  
- **Options**: Comma-separated (e.g., `"noHeaders,noTruncate"`).  
- **Email** and **Token**: Atlassian credentials.

### Option B: Omit parameters to use Script Properties
If you leave some (or all) parameters blank, the script will use whatever you set in `url`, `email`, and `token` in Script Properties. For example:

```none
=ImportJSONAdvanced(
  "",
  "/issues",
  "",
  "",
  ""
)
```
- A blank `url` falls back to `url` from Script Properties.
- Blank `email`/`token` fallback to `email` and `token`.

---

## Debugging & Logs

- **Logs**: Use `Logger.log(...)` in Apps Script to see debug output:
  1. Run your function (e.g., `=ImportJSONAdvanced(...)`) in the spreadsheet.
  2. Switch to the script editor and go to **View** → **Logs**.
- **Check the HTTP status**: Ensure you get `200` for success. `401` or `403` typically indicate invalid credentials.

---

## Common Errors & Tips

1. **401 / 403**: Check that `email` and `token` are correct in script properties.  
2. **Limitations**: By default, Atlassian APIs can page data (e.g., Jira might only return 50–100 issues at a time). You may need to handle pagination or specify `maxResults`.  
3. **Rate Limits**: Atlassian Cloud may enforce rate limits. If you see HTTP `429`, consider throttling requests or narrowing your search queries.  

---

## Contributing

1. **Fork** the repository and clone it to your local machine.  
2. **Make changes** or improvements to the script.  
3. **Submit a pull request** if you have enhancements or bug fixes.

---

## License

This project is based on the original [ImportJSON library by Trevor Lohrbeer](http://blog.fastfedora.com/projects/import-json). See [LICENSE](LICENSE) for details, typically GPL-3.0 or similar.  

For any organization-specific usage, ensure you comply with Atlassian’s API terms and your company’s data security policies.

---

**Happy importing!** If you have any questions, open an issue on GitHub or contact your Atlassian administrator for additional details on API tokens and project configuration.
