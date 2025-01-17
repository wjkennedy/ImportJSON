/**
 * Retrieves all the rows in the active spreadsheet that contain data and logs the
 * values for each row.
 */
function readRows() {
  var sheet = SpreadsheetApp.getActiveSheet();
  var rows = sheet.getDataRange();
  var numRows = rows.getNumRows();
  var values = rows.getValues();

  for (var i = 0; i <= numRows - 1; i++) {
    var row = values[i];
    Logger.log(row);
  }
}

/**
 * Adds a custom menu to the active spreadsheet, containing a single menu item
 * for invoking the readRows() function specified above.
 */
function onOpen() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var entries = [{
    name : "Read Data",
    functionName : "readRows"
  }];
  sheet.addMenu("Script Center Menu", entries);
}

/*====================================================================================================================================*
  ImportJSON by Trevor Lohrbeer (@FastFedora)
  Extended for Atlassian Cloud Auth by <your-name-here>
  ====================================================================================================================================
*/

/**
 * Imports a JSON feed and returns the results to be inserted into a Google Spreadsheet. 
 *
 * Optionally pass in Atlassian credentials for Basic Auth (for Jira, Confluence Cloud, etc.):
 *    ImportJSON("https://your-domain.atlassian.net/rest/api/3/...", "/issues", "", "my.email@domain.com", "myApiToken")
 *
 * @param {string} url        The URL to a public or Atlassian Cloud JSON feed.
 * @param {string} query      A comma-separated list of paths to import.
 * @param {string} options    A comma-separated list of options (e.g. "noHeaders,noTruncate").
 * @param {string} email      (Optional) Atlassian Cloud user email.
 * @param {string} token      (Optional) Atlassian Cloud API token.
 *
 * @return {Array<Array>} Two-dimensional array of data, with the first row containing headers.
 * @customfunction
 */
function ImportJSON(url, query, options, email, token) {
  return ImportJSONAdvanced(url, query, options, email, token, includeXPath_, defaultTransform_);
}

/**
 * An advanced version of ImportJSON designed to be easily extended by a script.
 *
 * Optionally pass in Atlassian credentials for Basic Auth (for Jira, Confluence Cloud, etc.).
 *
 * @param {string}           url          The URL to a public or Atlassian Cloud JSON feed.
 * @param {string}           query        The query passed to the include function.
 * @param {string}           options      A comma-separated list of options.
 * @param {string}           email        (Optional) Atlassian Cloud user email.
 * @param {string}           token        (Optional) Atlassian Cloud API token.
 * @param {function}         includeFunc  Function with signature func(query, path, options).
 * @param {function}         transformFunc Function with signature func(data, row, col, options).
 *
 * @return {Array<Array>} Two-dimensional array of data, with the first row containing headers
 */
function ImportJSONAdvanced(url, query, options, email, token, includeFunc, transformFunc) {
  var fetchOptions = {
    method: 'get',
    muteHttpExceptions: true
  };
  
  // If Atlassian Cloud creds provided, add Authorization header
  if (email && token) {
    var authString = email + ':' + token; 
    var authHeader = Utilities.base64Encode(authString);
    fetchOptions.headers = {
      'Authorization': 'Basic ' + authHeader
    };
  }

  var jsondata = UrlFetchApp.fetch(url, fetchOptions);
  var object   = JSON.parse(jsondata.getContentText());
  
  return parseJSONObject_(object, query, options, includeFunc, transformFunc);
}

/** 
 * Encodes the given value to use within a URL.
 */
function URLEncode(value) {
  return encodeURIComponent(value.toString());  
}

/** 
 * Parses a JSON object and returns a two-dimensional array containing the data of that object.
 */
function parseJSONObject_(object, query, options, includeFunc, transformFunc) {
  var headers = new Array();
  var data    = new Array();
  
  if (query && !Array.isArray(query) && query.toString().indexOf(",") != -1) {
    query = query.toString().split(",");
  }
  
  if (options) {
    options = options.toString().split(",");
  }
    
  parseData_(headers, data, "", 1, object, query, options, includeFunc);
  parseHeaders_(headers, data);
  transformData_(data, options, transformFunc);
  
  return hasOption_(options, "noHeaders") ? (data.length > 1 ? data.slice(1) : new Array()) : data;
}

/** 
 * Parses the data contained within the given value...
 */
function parseData_(headers, data, path, rowIndex, value, query, options, includeFunc) {
  var dataInserted = false;
  
  if (isObject_(value)) {
    for (var key in value) {
      if (parseData_(headers, data, path + "/" + key, rowIndex, value[key], query, options, includeFunc)) {
        dataInserted = true; 
      }
    }
  } else if (Array.isArray(value) && isObjectArray_(value)) {
    for (var i = 0; i < value.length; i++) {
      if (parseData_(headers, data, path, rowIndex, value[i], query, options, includeFunc)) {
        dataInserted = true;
        rowIndex++;
      }
    }
  } else if (!includeFunc || includeFunc(query, path, options)) {
    // Handle arrays containing only scalar values
    if (Array.isArray(value)) {
      value = value.join(); 
    }
    
    // Insert new row if one doesn't already exist
    if (!data[rowIndex]) {
      data[rowIndex] = new Array();
    }
    
    // Add a new header if one doesn't exist
    if (!headers[path] && headers[path] != 0) {
      headers[path] = Object.keys(headers).length;
    }
    
    // Insert the data
    data[rowIndex][headers[path]] = value;
    dataInserted = true;
  }
  
  return dataInserted;
}

/** 
 * Parses the headers array and inserts it into the first row of the data array.
 */
function parseHeaders_(headers, data) {
  data[0] = new Array();
  for (var key in headers) {
    data[0][headers[key]] = key;
  }
}

/** 
 * Applies the transform function for each element in the data array...
 */
function transformData_(data, options, transformFunc) {
  for (var i = 0; i < data.length; i++) {
    for (var j = 0; j < data[i].length; j++) {
      transformFunc(data, i, j, options);
    }
  }
}

/** 
 * Returns true if the given test value is an object; false otherwise.
 */
function isObject_(test) {
  return Object.prototype.toString.call(test) === '[object Object]';
}

/** 
 * Returns true if the given test value is an array containing at least one object; false otherwise.
 */
function isObjectArray_(test) {
  for (var i = 0; i < test.length; i++) {
    if (isObject_(test[i])) {
      return true; 
    }
  }  
  return false;
}

/** 
 * Returns true if the given query applies to the given path.
 */
function includeXPath_(query, path, options) {
  if (!query) {
    return true; 
  } else if (Array.isArray(query)) {
    for (var i = 0; i < query.length; i++) {
      if (applyXPathRule_(query[i], path, options)) {
        return true; 
      }
    }  
  } else {
    return applyXPathRule_(query, path, options);
  }
  return false; 
}

/** 
 * Returns true if the rule applies to the given path.
 */
function applyXPathRule_(rule, path, options) {
  return path.indexOf(rule) == 0; 
}

/** 
 * Default transform function...
 */
function defaultTransform_(data, row, column, options) {
  if (!data[row][column]) {
    if (row < 2 || hasOption_(options, "noInherit")) {
      data[row][column] = "";
    } else {
      data[row][column] = data[row-1][column];
    }
  } 

  if (!hasOption_(options, "rawHeaders") && row == 0) {
    if (column == 0 && data[row].length > 1) {
      removeCommonPrefixes_(data, row);  
    }
    data[row][column] = toTitleCase_(data[row][column].toString().replace(/[\/\_]/g, " "));
  }
  
  if (!hasOption_(options, "noTruncate") && data[row][column]) {
    data[row][column] = data[row][column].toString().substr(0, 256);
  }

  if (hasOption_(options, "debugLocation")) {
    data[row][column] = "[" + row + "," + column + "]" + data[row][column];
  }
}

/** 
 * If all the values in the given row share the same prefix, remove that prefix.
 */
function removeCommonPrefixes_(data, row) {
  var matchIndex = data[row][0].length;
  for (var i = 1; i < data[row].length; i++) {
    matchIndex = findEqualityEndpoint_(data[row][i-1], data[row][i], matchIndex);
    if (matchIndex == 0) {
      return;
    }
  }
  for (var i = 0; i < data[row].length; i++) {
    data[row][i] = data[row][i].substring(matchIndex, data[row][i].length);
  }
}

/** 
 * Locates the index where the two strings values stop being equal, stopping automatically at the stopAt index.
 */
function findEqualityEndpoint_(string1, string2, stopAt) {
  if (!string1 || !string2) {
    return -1; 
  }
  var maxEndpoint = Math.min(stopAt, string1.length, string2.length);
  for (var i = 0; i < maxEndpoint; i++) {
    if (string1.charAt(i) != string2.charAt(i)) {
      return i;
    }
  }
  return maxEndpoint;
}

/** 
 * Converts the text to Title Case.
 */
function toTitleCase_(text) {
  if (text == null) {
    return null;
  }
  return text.replace(/\w\S*/g, function(word) {
    return word.charAt(0).toUpperCase() + word.substr(1).toLowerCase();
  });
}

/** 
 * Returns true if the given set of options contains the given option.
 */
function hasOption_(options, option) {
  return options && options.indexOf(option) >= 0;
}
