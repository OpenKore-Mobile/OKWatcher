// ╔═╗╦╔═  ╦ ╦┌─┐┌┬┐┌─┐┬ ┬┌─┐┬─┐
// ║ ║╠╩╗  ║║║├─┤ │ │  ├─┤├┤ ├┬┘
// ╚═╝╩ ╩  ╚╩╝┴ ┴ ┴ └─┘┴ ┴└─┘┴└─

var watch = require('node-watch');
var got = require('got');
var fs = require('fs');
var path = require('path');
var pjson = require('./package.json');

var username = 'ADMIN';
var password = 'PASSWORD';
var logServer = 'https://LOGSERVER.COM';

var auth = `Basic ${new Buffer(`${username}:${password}`).toString('base64')}`;

function grepRoUsername() {
  var configContent = fs.readFileSync('./control/config.txt', 'utf-8');
  var roUsernameRe = /username (.*)/;
  var roUsernameFound = configContent.match(roUsernameRe);
  if (roUsernameFound === null) {
    return null;
  } else {
    return roUsernameFound[1];
  }
}

function checkLatestVersion(clientVersion, callback) {
  var versionAPI = `${logServer}/api/v1/version`;
  console.log('[-] Connecting to Log Server...');
  got(versionAPI).then(response => {
    var versionJson = JSON.parse(response.body);
    var isLatest = versionJson.service.client.version === clientVersion;
    callback(null, isLatest);
  }).catch(error => {
    console.log(`[x] ERROR CODE: ${error.code}`);
  });;

}

function register(username) {
  var registerAPI = `${logServer}/api/v1/account`;
  var payload = {
    username: username,
  };

  var options = {
    method: 'POST',
    json: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify(payload),
  };

  got(registerAPI, options).then(response => {

    if (error.response.statusCode === 201) {
      console.log(`[*] Connected! Welecome ${roUsername}`);
    }

    // console.log(response.statusCode);
  }).catch(error => {
    if (error.response.statusCode === 409) {
      console.log(`[*] Connected! Welecome back ${roUsername}`);
    } else {
      console.log(`[*] ERROR: ${error.response.body}`);
    }

    // console.log(error.response.body);
  });
}

function patchConfigFile() {
  var configPath = './control/config.txt';
  var logToFileSetting = 'logToFile_Messages list=items.txt;info=charInfo.txt;';

  var configContent = fs.readFileSync(configPath, 'utf-8');
  var patched = configContent.includes(logToFileSetting);

  if (!patched) {
    configContent = configContent.replace(/logToFile_Messages/g, logToFileSetting);

    fs.writeFile(configPath, configContent, function (err) {
      if (err) { return console.log(err); }

      console.log('[*] The config.txt file was patched!');
    });

  } else {
    console.log('[*] The config.txt file has already been patched!');
  }

}

function patchMacrosFile() {
  var macrosPath = './control/macros.txt';
  var macrosSetting = '\n\nautomacro autoLog {\n\ttimeout 60\n\tcall {\n\t\tdo exp output\n\t\tdo i\n\t\tdo s\n\t}\n}';

  var macrosContent = fs.readFileSync(macrosPath, 'utf-8');
  var patched = macrosContent.includes('autoLog');

  if (!patched) {
    fs.appendFile(macrosPath, macrosSetting, function (err) {
      if (err) { return console.log(err); }

      console.log('[*] The macros.txt file was patched!');
    });
  } else {
    console.log('[*] The macros.txt file has already been patched!');
  }
}

function patchLogPm() {
  var logPmPath = './src/Log.pm';
  var logPmOldStr = 'open(F, ">>:utf8", "$Settings::logs_folder/$file")';
  var logPmNewStr = 'open(F, ">:utf8", "$Settings::logs_folder/$file")';

  var logPmContent = fs.readFileSync(logPmPath, 'utf-8');
  var patched = logPmContent.includes(logPmNewStr);
  if (!patched) {
    logPmContent = logPmContent.replace(logPmOldStr, logPmNewStr);

    fs.writeFile(logPmPath, logPmContent, function (err) {
      if (err) { return console.log(err); }

      console.log('[*] The Log.pm file was patched!');
    });

  } else {
    console.log('[*] The Log.pm file has already been patched!');
  }
}

function patchCommandsPm() {
  var commandsPmPath = './src/Commands.pm';
  var commandsPmOldStr = 'open(F, ">>:utf8", "$Settings::logs_folder/exp.txt");';
  var commandsPmNewStr = 'open(F, ">:utf8", "$Settings::logs_folder/exp.txt");';

  var commandsPmContent = fs.readFileSync(commandsPmPath, 'utf-8');
  var patched = commandsPmContent.includes(commandsPmNewStr);
  if (!patched) {
    commandsPmContent = commandsPmContent.replace(commandsPmOldStr, commandsPmNewStr);

    fs.writeFile(commandsPmPath, commandsPmContent, function (err) {
      if (err) { return console.log(err); }

      console.log('[*] The Commands.pm file was patched!');
    });

  } else {
    console.log('[*] The Commands.pm file has already been patched!');
  }
}

function saveExpReport(username) {
  // exp.txt
  var expReportAPI = `${logServer}/api/v1/exp_report`;

  var payload = {
    username: username,
    exp_report: new Buffer(fs.readFileSync('./logs/exp.txt', 'utf-8')).toString('base64'),
  };

  var options = {
    method: 'POST',
    json: true,
    headers: {
      'Content-Type': 'application/json',
      Authorization: auth,
    },
    body: JSON.stringify(payload),
  };

  got(expReportAPI, options);

}

function saveCharInfo(username) {
  // charInfo.txt
  var charInfoAPI = `${logServer}/api/v1/char_info`;

  var charInfoContent = fs.readFileSync('./logs/charInfo.txt', 'utf-8');
  var hasStatusInfo = charInfoContent.includes(' Status ');

  if (hasStatusInfo) {
    var payload = {
      username: username,
      char_info: new Buffer(charInfoContent).toString('base64'),
    };

    var options = {
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(payload),
    };

    got(charInfoAPI, options);
  }
}

function saveItems(username) {
  // items.txt
  var itemsAPI = `${logServer}/api/v1/items`;

  var itemsContent = fs.readFileSync('./logs/items.txt', 'utf-8');
  var hasInventoryInfo = itemsContent.includes(' Inventory ');

  if (hasInventoryInfo) {
    var payload = {
      username: username,
      items: new Buffer(itemsContent).toString('base64'),
    };

    var options = {
      method: 'POST',
      json: true,
      headers: {
        'Content-Type': 'application/json',
        Authorization: auth,
      },
      body: JSON.stringify(payload),
    };

    got(itemsAPI, options);
  }
}

console.log(`=== OKWatcher Version: ${pjson.version} ===`);

var roUsername = grepRoUsername();

if (roUsername === '' || roUsername === null) {
  console.log('[x] ERROR: USERNAME NOT FOUND!');
  setTimeout(() => { console.log('[*] Exit'); }, 3000);
} else {
  console.log('[*] Patching files...');
  patchConfigFile();
  patchMacrosFile();
  patchLogPm();
  patchCommandsPm();

  checkLatestVersion(pjson.version, (err, isLatest) => {

    if (isLatest) {
      register(roUsername);
      watch('./logs', function (filename) {
        var logFilename = path.basename(filename);
        console.log(`[*] ${filename} changed. Saved it.`);

        if (logFilename === 'exp.txt') {
          saveExpReport(roUsername);
        } else if (logFilename === 'charInfo.txt') {
          saveCharInfo(roUsername);
        } else if (logFilename === 'items.txt') {
          saveItems(roUsername);
        }

      });
    } else {
      console.log('[x] VERSION CHECK ERROR: Please check the OKWatcher version!');
      setTimeout(() => { console.log('[*] Exit'); }, 3000);
    }

  });
}
