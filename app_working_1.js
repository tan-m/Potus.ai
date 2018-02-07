/**
 * Copyright 2015 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

var express = require('express'); // app server
var bodyParser = require('body-parser'); // parser for post requests
var Conversation = require('watson-developer-cloud/conversation/v1'); // watson sdk

global.startFlag = true;
global.welcomeMessage = true;

var app = express();

// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

function toUpper(str) {
return str
    .toLowerCase()
    .split(' ')
    .map(function(word) {
        return word[0].toUpperCase() + word.substr(1);
    })
    .join(' ');
 }
 

var map = new Object(); // or var map = {};
function get(k) {
    return map[k];
}

// Create the service wrapper
var conversation = new Conversation({
  // If unspecified here, the CONVERSATION_USERNAME and CONVERSATION_PASSWORD env properties will be checked
  // After that, the SDK will fall back to the bluemix-provided VCAP_SERVICES environment property
  //'username': process.env.CONVERSATION_USERNAME,
  //'password': process.env.CONVERSATION_PASSWORD,
  'version_date': '2017-05-26'
});

// Endpoint to be call from the client side
app.post('/api/message', function(req, res) {
  var workspace = process.env.WORKSPACE_ID || '<workspace-id>';
  if (!workspace || workspace === '<workspace-id>') {
    return res.json({
      'output': {
        'text': 'The app has not been configured with a <b>WORKSPACE_ID</b> environment variable. Please refer to the ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple">README</a> documentation on how to set this variable. <br>' + 'Once a workspace has been defined the intents may be imported from ' + '<a href="https://github.com/watson-developer-cloud/conversation-simple/blob/master/training/car_workspace.json">here</a> in order to get a working application.'
      }
    });
  }
  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };

  // Send the input to the conversation service
  conversation.message(payload, function(err, data) {
    if (err) {
      return res.status(err.code || 500).json(err);
    }
    return res.json(updateMessage(payload, data));
  });
});

/**
 * Updates the response text using the intent confidence
 * @param  {Object} input The request to the Conversation service
 * @param  {Object} response The response from the Conversation service
 * @return {Object}          The response with the updated message
 */
function updateMessage(input, response) {

  var responseText = null;
  if (global.welcomeMessage === true) {
  	welcomeMessage = false;
  	return response;
  }
  
  if (global.startFlag === true) {
  
  		var fs = require('fs');
		var csv = require('fast-csv');
		
		const exec = require('child_process').exec;

		function os_func() {
			this.execCommand = function(cmd, callback) {
				exec(cmd, (error, stdout, stderr) => {
				    if (error) {
				        console.error(`exec error: ${error}`);
				        return;
				    }

				    callback(stdout);
				});
			}
		}
		var os = new os_func();

		os.execCommand('python pythonProgram.py \"'+ response.input.text + '\"', function (returnvalue) {
			// Here you can get the return value
			console.log("the return value is " + returnvalue);
			
			var fileName = toUpper(response.input.text).replace(/\s+/g, "_") + ('.csv');
			console.log("fileName is "+ fileName);
			
			fs.createReadStream(fileName)
			.pipe(csv())
			.on('data', function(data) {
				console.log(data);
				for (var i = 0; i < data.length; i++) {
		   			var list = get(data[0]);
		   			if (list) {
		   				list.push(data[i]);
		   			} else {
		   				list = [data[i]]
		   				map[data[0]] = list;
		   			}
				}
			})
			.on('end', function(data) {
				console.log('Read finished');
				
				global.startFlag = false;
				console.log("after that");
		
				
	  			
				
				
			}); // end of reading csv
			
			
	  		
	  		
			
		}); // end of python script execution
		
		response.output.text = "Hello. I am " + toUpper(response.input.text) ;
		return response;
	} 
  
  
  if (response.intents && response.intents[0]) {
    var intent = response.intents[0];
    // Depending on the confidence of the response the app can return different messages.
    // The confidence will vary depending on how well the system is trained. The service will always try to assign
    // a class/intent to the input. If the confidence is low, then it suggests the service is unsure of the
    // user's intent . In these cases it is usually best to return a disambiguation message
    // ('I did not understand your intent, please rephrase your question', etc..)
    
    console.log("start flag is " + global.startFlag);
    
    
    if (intent.confidence >= 0.70) {
		
	
		console.log("in flag false part");
		
		switch(intent.intent) {
        	case "birthDate":
            	responseText = "I was born on ";
        		break;
        	case "birthPlace":
        		responseText = "I was born at ";
        		break;
        	case "child":
        		responseText = "My children are ";
        		break;
        	case "parent":
        		responseText = "My parents are ";
        		break;
        	case "description":
        		responseText = "I am also a ";
        		break;
        	case "gender":
        		responseText = "I am ";
        		break;
        	case "party":
        		responseText = "I belong to the ";
        		break;
        	case "residence":
        		responseText = "I am from ";
        		break;
        	case "spouse":
        		responseText = "I am married to ";
        		break;
        	case "networth":
        		responseText = "My net worth is about ";
        		break;
        	default:
        		responseText = "I don't get it. Can you ask another question please?";
    	} 
	
      
    } else if (intent.confidence >= 0.5) {
      responseText = 'I think your intent was ' + intent.intent;
    } else {
      responseText = 'I did not understand your intent';
    }
  }
  response.output.text = responseText;
  return response;
}

module.exports = app;
