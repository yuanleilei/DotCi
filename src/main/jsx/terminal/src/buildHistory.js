var request = require('request');
import build from './build.js';
import contrib from 'blessed-contrib';
import blessed from 'blessed';
import buildColor from './buildColors.js'
function buildRow(build){
  let {number,displayTime,result,commit} = build;
  let {committerName,message,shortSha,branch} = commit;
  let color = buildColor(result);
  let cols = [displayTime, result, branch, committerName,message,shortSha].map( col => color(col));
  return [number + ''].concat(cols);
}
function buildHistoryWidget(serverUrl,repoName,screen,inputBuilds,onBack){
  const url = getUrl(serverUrl,repoName);
  let builds =[];
  builds.push(['number','Ago', 'Result','Branch', 'Commiter','Message','Sha']);
  inputBuilds.forEach(build => builds.push( buildRow(build)));
  const table=  blessed.ListTable({
    parent:screen,
    screen,
    width: '100%',
    height: '100%',
    border: {
      type: 'line',
      left: true,
      top: true,
      right: false,
      bottom: false
    },
    align: 'center',
    tags: true,
    keys:true,
    vi:true,
    mouse: true,
    noCellBorders: true,
    style: {
      header: {
        fg: 'blue',
        bold: true
      },
      cell: {
        fg: 'white',
        selected: {
          bg: 'blue'
        }
      }
    },
    rows:builds
  });
  table.builds = inputBuilds;
  table.on('select',item => {
    const number =item.parent.rows[item.parent.selected][0];
    const axisList = item.parent.builds[item.parent.selected-1]['axisList'];
    build(serverUrl,url,screen,number,axisList,onBack);
  });
  table.focus();
}

function getUrl(serverUrl,repoName){
  const org =  repoName.split('/')[0];
  const repo =  repoName.split('/')[1];
  return `${serverUrl}/job/${org}/job/${repo}/`
}
export default function(serverUrl,repoName,screen,onBack){
  request(
    {
      uri: getUrl(serverUrl,repoName)+ 'api/json/',
      qs: {
        tree:  "appData[info[buildHistoryTabs,builds[*,commit[*],cause[*],parameters[*]]]]",
        branchTab: 'All',
        count: 50
      }
    }, function (error, response, body) {
      if (!error && response.statusCode == 200) {
        var builds = JSON.parse(body)['appData']['info']['builds'];
        buildHistoryWidget(serverUrl,repoName,screen,builds,onBack);
        screen.render();
      }else{
        console.error(error);
      }
    })

}
