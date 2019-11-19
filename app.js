const express = require("express");
const path = require("path");
const request = require('request');
const app = express();

const CLIENT_ID = "7229d956c71f7b848163";
const CLIENT_SECRET = "179e6fb8e94a9ca225fcac42edc3c63066791d4e";
const REDIECT_URI = "http://localhost/signin/callback";

let auth_token = "";
let repoLst = [];

//set view engine to ejs
app.set('view engine', 'ejs');

//set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get("/", function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get("/home", function (req, res) {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.get("/signin", function (req, res) {
  res.redirect(`https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=${REDIECT_URI}`);
});

app.get("/signin/callback", function (req, res) {
  if (!req.query.code) {
    return res.send({
      success: false,
      message: "Error: no code or user id"
    });
  }

  request.post({
    url: 'https://github.com/login/oauth/access_token',
    form: {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      code: req.query.code
    }
  }, function (err, httpResponse, body) {
    auth_token = body.split("&")[0].split("=")[1];
    res.redirect("/analyze");
  });

});


app.get("/byrepo", function (req, res) {
  const userId = req.query.uid;
  const repo = req.query.repoName;
  if (!repo || !userId) {
    return res.send({
      success: false,
      message: "Error: no repo selected"
    });
  }

  let languagesDict = {};

  new Promise((resolveOuter, reject) => {
    request({ url: `https://api.github.com/repos/${userId}/${repo}`, headers: { 'User-Agent': 'request', "Authorization": "token " + auth_token } },
      async (error, response, body) => {
        const data = JSON.parse(body);
        const repoLanguageUrl = data["languages_url"];
        request({ url: repoLanguageUrl, headers: { 'User-Agent': 'request', "Authorization": "token " + auth_token } },
          (error, response, languageBody) => {
            languagesDict = JSON.parse(languageBody);
            resolveOuter([data.message, languagesDict]);
          });
      });
  }).then((value) => {
    let alert = false;
    if ((value[0] && value[0].indexOf("API rate limit exceeded") == 0) || (value[1].message && value[1].message.indexOf("API rate limit exceeded") == 0)) {
      alert = true;
    }

    let languagesArray = [['Languages', 'Number of bytes']];
    for (let lKey in value[1]) {
      languagesArray.push([lKey, value[1][lKey]]);
    }

    res.render(path.join(__dirname, 'public/analytics.ejs'), {
      dataArr: languagesArray,
      repoArr: repoLst,
      currUsername: userId,
      selectedRepo: repo,
      alertOrNot: alert
    });
  });

});

app.get("/analyze", function (req, res) {
  let userId = "";
  if (req.query.uid) {
    userId = req.query.uid;
  }
  repoLst = [];
  new Promise((resolveOuter, reject) => {
    request({ url: `https://api.github.com/users/${userId}/repos`, headers: { 'User-Agent': 'request', "Authorization": "token " + auth_token } },
      async (error, response, body) => {
        const data = JSON.parse(body);
        let languageUrls = [];
        for (let i = 0; i < data.length; i++) {
          languageUrls.push(...[data[i]["languages_url"]]);
          repoLst.push(data[i]["name"]);
        }
        languagesDict = {};
        let loadLanguagesPromise = [];
        languageUrls.forEach(url => {
          const promise = new Promise((resolveInner) => {
            request({ url: url, headers: { 'User-Agent': 'request', "Authorization": "token " + auth_token } },
              (error, response, languageBody) => {
                resolveInner(languageBody);
              });
          }).then((innerBody) => {
            thisLanguageDict = JSON.parse(innerBody);
            for (let lKey in thisLanguageDict) {
              if (lKey in languagesDict) {
                languagesDict[lKey] += thisLanguageDict[lKey];
              } else {
                languagesDict[lKey] = thisLanguageDict[lKey];
              }
              console.log(languagesDict);
            }
          });
          loadLanguagesPromise.push(promise);
        });
        await Promise.all(loadLanguagesPromise);
        resolveOuter([data.message, languagesDict, repoLst]);
      });
  }).then((value) => {
    if ((value[0] && value[0].indexOf("API rate limit exceeded") == 0) || (value[1].message && value[1].message.indexOf("API rate limit exceeded") == 0)) {
      console.log("alert");
    }
    //make data array
    let languagesArray = [['Languages', 'Number of bytes']];
    for (let lKey in value[1]) {
      languagesArray.push([lKey, value[1][lKey]]);
    }
    res.render(path.join(__dirname, 'public/analytics.ejs'), {
      dataArr: languagesArray,
      repoArr: value[2],
      currUsername: userId,
      selectedRepo: null
    });
  });

});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));

