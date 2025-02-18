// token

let GITHUB_TOKEN = '';

let token = true;

function changeKey() {
  document.getElementById("classiccheckbutton").style.opacity = "0";
  GITHUB_TOKEN = document.getElementById("api-key").value;
  token = true;
}

// readme

async function getReadme(repoName) {
    try {

        const apiUrl = `https://api.github.com/repos/${repoName}/contents/README.md`;
        const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
        const response = await fetch(apiUrl, { headers });

        if (!response.ok) {
          if (response.status === 404) {
                return "Github API Error: 404<br/><br/>This repository may not exist or does not have a README file.";
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }

        const data = await response.json();
        const readmeContent = atob(data.content);

        return readmeContent;
    } catch (error) {
        return `Error: ${error.message}`;
        checkRateLimit();
    }
}
async function displayReadme(repoName) {
    const readmeMarkdown = await getReadme(repoName);
    document.getElementById('readme-container').innerHTML = marked.parse(readmeMarkdown);
}


// file tree


async function getRepoFileTree(repoName, path = '') {
    try {
        const apiUrl = `https://api.github.com/repos/${repoName}/contents/${path}`;
        const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
          throw new Error(`GitHub API error: ${response.status}`);
            if (response.status === 404) { 
                return "This repository does not exist or is private.";
            }
        }
        
        const data = await response.json();
        document.getElementById('readme-container').innerHTML = '';
        data.forEach(file => {
            const item = document.createElement('div');
            item.textContent = `${file.type}: ${file.name}`;
            item.classList.add("dir-stuff")
            item.style.cursor = 'pointer';
            item.onclick = () => {
                if (file.type === 'dir') {
                    getRepoFileTree(repoName, file.path);
                } else {
                    getFileContent(repoName, file.path, false);
                }
            };
            document.getElementById('readme-container').appendChild(item);
        });
    } catch (error) {
        document.getElementById('readme-container').innerText += `Error: ${error.message}`;
        checkRateLimit();
    }
}
async function getFileContent(repoName, filePath, heapRequests) {
    try {
        const apiUrl = `https://api.github.com/repos/${repoName}/contents/${filePath}`;
        const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const fileContainer = document.getElementById('readme-container');
        if (!heapRequests) {
          fileContainer.innerHTML = '';
        }
        
        if (filePath.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
            
            const img = document.createElement('img');
            img.src = `https://raw.githubusercontent.com/${repoName}/refs/heads/main/${filePath}`;
            img.style.maxWidth = '100%';
            imgName = "<br/>"+filePath+"<br/>";
            fileContainer.innerHTML += imgName;
            fileContainer.appendChild(img);
            
        } else {
            const fileContent = await response.text();
            fileContainer.innerText = fileContent;
        }
    } catch (error) {
        document.getElementById('readme-container').innerText += `Error: ${error.message}`;
    }
}
async function getAllImages(repoName, childFolder) {
  try {
        const apiUrl = `https://api.github.com/repos/${repoName}/contents/assets/2x${childFolder}`;
        const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
        const response = await fetch(apiUrl, { headers });
        
        if (!response.ok) {
            if (response.status === 404) {
                return "This repository does not exist or is private.";
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const data = await response.json();
        for (const file of data) {
            if (file.type == "dir") {
              childDirectory = "/" + file.name;
              await getAllImages(repoName, childDirectory);
            } else {
              if (childFolder == "") {
                fullPath = "assets/2x/" + file.name;
              } else {
                fullPath = "assets/2x" + childFolder + "/" + file.name
              }
              
              await getFileContent(repoName, fullPath, true)
            }
        }
    } catch (error) {
        document.getElementById('readme-container').innerText += `Error: ${error.message}`;
        checkRateLimit();
    }
}
async function checkRateLimit() {
    const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
    const response = await fetch("https://api.github.com/rate_limit", { headers });

    const data = await response.json();
    document.getElementById('readme-container').innerHTML += "<hr/>Remaining API Requests: " + data.rate.remaining
}
async function getRepoFileTreeQuiet(repoName, path = '') {
    try {
        const apiUrl = `https://api.github.com/repos/${repoName}/contents/${path}`;
        const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
        const response = await fetch(apiUrl, { headers });
        
        document.getElementById('readme-container').innerHTML = "Searching file contents";
        if (!response.ok) {
            if (response.status === 404) {
                return "This repository does not exist or is private.";
            }
            throw new Error(`GitHub API error: ${response.status}`);
        }
        console.log("Opening Repo File Tree...")
        
        const data = await response.json();
        const files = [];
        for (const file of data) {
            document.getElementById('readme-container').innerHTML = file.path;
            if (file.type === 'dir') {  
                files.push(...await getRepoFileTreeQuiet(repoName, file.path));
            } else {
                files.push(file.path);
            }
        }
        return files;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}
async function searchInFiles(repoName, searchTerm) {
    try {
        document.getElementById('readme-container').innerHTML = "Getting file tree...";
        const files = await getRepoFileTreeQuiet(repoName);
        const matches = [];
        document.getElementById('readme-container').innerHTML = "Loading...";
        
        for (const filePath of files) {
            const apiUrl = `https://api.github.com/repos/${repoName}/contents/${filePath}`;
            const headers = token ? { 'Accept': 'application/vnd.github.v3+json', 'Authorization': `token ${token}` } : { 'Accept': 'application/vnd.github.v3+json' };
        
            const response = await fetch(apiUrl, { headers });
            
            if (response.ok) {
                const content = await response.text();
                const lines = content.split('\n');
                
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(searchTerm.toLowerCase())) {
                        const before = lines[index - 1] || '';
                        const between = lines[index];
                        const after = lines[index + 1] || '';

                        document.getElementById('readme-container').innerHTML += `<hr/><div class="dir-stuff" onclick="getFileContent(document.getElementById('readme-input').value, event.currentTarget.children[0].innerHTML, false);"><b>${filePath}</b></div>`;
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>1."+lines[index - 3]+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>2."+lines[index - 2]+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>4."+lines[index - 1]+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>4."+between+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>5."+lines[index + 1]+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>6."+lines[index + 2]+"<br/></span>";
                        document.getElementById('readme-container').innerHTML += "<span style='font-family: monospace;'>7."+lines[index + 3]+"<br/></span>";
                        matches.push({ filePath, line: index + 1, before, match: line, after });
                    }
                });
            }
        }
        
        console.log('Search results:', matches);
        return matches;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        return [];
    }
}
function showHelp() {
  document.getElementById('readme-container').innerHTML = `

  <h1>Welcome to the Balatro Mod Viewer!</h1>
  <p><b>Balatro Mod Viewer</b> is one of my (@evanworks) projects that I've made to help me better view Balatro mods. Most Balatro mods exist in simple GitHub repositories with no wiki, formatting, or instructions, just the simple assumption that you know what you're doing. (In fact, maybe all Balatro mods would be this way if it wasn't for @notmario and his mod template).</p>
  <h2>So what does it do?</h2>
  <p>The Balatro mod viewer makes use of the Github API to search for correlations between image files and .lua scripts. It's currently a work in progress, so some planned features may not be available just yet ;)</p>
  <h2>Warning about pressing these buttons</h2>
  <p>The wonderful Github API comes at a cost. Due to these extreme searches of almost all files in a repository, many, many, requests are used. <b>Normal people have only 60 requests,</b> and as they replenish every hour, you may only be able to create wikis one at a time. There are some features, however, that use only one or ten requests, and are better suited for normal people:</p>
  <ul>
    <li>
      <b>Display README: </b> Displays the README file in any repository. It must be noted that the program assumes the file is named README.md in the parent directory. (Requests: 1)
    </li>  
    <li>
      <b>Display File Tree: </b> Creates an interactable view of every single file. Triggers a request for every folder shown on the screen (Requests: 4 to 400)
    </li>  
    <li>
      <b>Search in Files: </b> Searches for a keyword in all the files in a repository. Hover to use search box. Displays the above and below lines in the code. There should be a slider to change the amount, but there isn't :) (Requests: ~20)
    </li>  
    <li>
      <b>View All Images: </b> Finds and displays all the images in the directory assets/2x and children. (Requests: ~20)
    </li>  
    <li>
      <b>Check Rate Limit: </b> Tells you how many requests you have remaining. (Requests: 0)
    </li>  
  </ul>
  `
}