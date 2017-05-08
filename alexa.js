'use strict';
var https = require('https');
const AWS = require('aws-sdk');
const docClient = new AWS.DynamoDB.DocumentClient({region: 'us-east-1'});

var k_google = "AIzaSyBgvp1ImeOwzOzHChems65-mrsdZtMnMaI";
var src = "en";
var t = "ko";
var k_slack = "LLDtMf8crIkAznPCJ0lJLCQI";
var ch = "%23general";

exports.handler = function (event, context) {
    try {
      console.log("event.session.application.applicationId=" + event.session.application.applicationId);
      /**
       * Uncomment this if statement and populate with your skill's application ID to
       * prevent someone else from configuring a skill that sends requests to this function.
       */
      if (event.session.new) {
          onSessionStarted({requestId: event.request.requestId}, event.session);
      }
      if (event.request.type === "LaunchRequest") {
          onLaunch(event.request,
              event.session,
              function callback(sessionAttributes, speechletResponse) {
                  context.succeed(buildResponse(sessionAttributes, speechletResponse));
              });
      } else if (event.request.type === "IntentRequest") {
          onIntent(event.request,
              event.session,
              function callback(sessionAttributes, speechletResponse) {
                  context.succeed(buildResponse(sessionAttributes, speechletResponse));
              });
      } else if (event.request.type === "SessionEndedRequest") {
          onSessionEnded(event.request, event.session);
          context.succeed();
      }
  } catch (e) {
      context.fail("Exception: " + e);
  }
};

/**
 * Called when the session starts.
 */
function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // add any session init logic here
}

/**
 * Called when the user invokes the skill without specifying what they want.
 */
function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId
        + ", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
}

 function onIntent(intentRequest, session, callback){
    console.log("onIntent requestId="+intentRequest.requestId+", seesionId="+ session.sessionId);

    var intent = intentRequest.intent;
    var intentName = intentRequest.intent.name;

    if("SetTargetIntent" ===intentName){
        console.log("set target is running111");
        setTarget(intent,callback);
    }else if("SetChannelIntent" === intentName){
        console.log("set channel is running1");
        setChannel(intent,callback);
    }
    else if("MyMessageIntent" === intentName){
        setMessageInSession(intent,session,callback);
    }
    //else if("MessageEndIntent" ===intentName){
      //  endMessageInSession(intent,session,callback);
    //}
    else{
        console.log("Unknown intent");
        throw "Invaild intent";
    }
}

function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId
        + ", sessionId=" + session.sessionId);
    // Add any cleanup logic here
}

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildSpeechletResponseWithoutCard(output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}

function getWelcomeResponse(callback){
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to the Alexa message app, "
        + "You can set slack channel and language you want to translate."
        + "first of all, set channel by saying, "
        + "set slack channel as...";
     // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "You can set slack channel and language you want to translate."
                + "set slack channel as...";
    var shouldEndSession = false;

    callback(sessionAttributes,
     buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
 }

//setting target language
function setTarget(intent,callback){
    console.log("set target is running222");

    var sessionAttributes = {};
    var speechOutput = "your language is set, you can send message, by saying "+"send.."   ;
    var repromptText = " ";
    var shouldEndSession = false;

    var target = intent.slots.target.value ;
    console.log("target language : ", target);

    if(target &&target.toLowerCase()==='german')
    {
        t = "de";
    }else if (target &&target.toLowerCase()==='korean')
    {
        t = "ko";
    }else if(target &&target.toLowerCase()==='chinese')
    {
        t = "zh-CN";
    }

    console.log ("selected target " , t );
    callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

//setting slack channel
function setChannel(intent, callback){
    console.log("channel setting start . . .");

    var sessionAttributes = {};
    var speechOutput = "your channel is set, you have to choose target language. by saying"
                        + "set language as...";
    var repromptText = "you have to choose target language. by saying"
                        + "set language as...";
    var shouldEndSession = false;

    var channel = intent.slots.channel.value;
    console.log("channel name:  " + channel);

    if(channel && channel.toLowerCase() == 'general'){
      ch = "general";
    }
    else if(channel && channel.toLowerCase() == 'suyoung'){
      ch = "suyoung";
    }
    else if(channel && channel.toLowerCase() == 'kangho'){
      ch = "kangho";
    }

    ch = "%23" + ch;
    console.log ("selected channel " + ch );
    callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));
}

function toSlack(message,m,callback, sessionAttributes, cardTitle, speechOutput, repromptText, shouldEndSession){
      var parseMsg = JSON.parse(m);
      var translatedTxt = parseMsg.data.translations[0].translatedText;
      console.log("final translated Text only :   " + translatedTxt);

      var opt = {
        host: 'handong-group.slack.com',
        path: '/services/hooks/slackbot?token='
            +k_slack
            +'&channel='+ch,
        method: 'POST',
        headers:{
          'connection': 'close'
        }
      };

      var params = {
        Item: {
          date: Date.now(),
          Channel: "ch",
          TargetLanguage: "t",
          EnglishMSG: "message",
          TranslateMSG: "translatedTxt"
        },
        TableName: 'slackMessageData'
      };

      docClient.put(params, function(err, data){
          if(err){
            callback(err, null);
          }
          else{
            callback(null, data);
          }
        });

    console.log("sending to slack");
      var msg = '';
      var req = https.request(opt, function (res) {
        console.log("statusCode from slack: ", res.statusCode);
        res.on('data', function (chunk) {
          msg += chunk;
          console.log('from slack ...',msg);
        });
        res.on('end',function(){
          console.log('from slack',msg);
        });
      });

      req.write(translatedTxt);
      req.write(message);
      req.end();

      callback(sessionAttributes,
        buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
    }

function endMessageInSession(intent,session,callback){
    var message;
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(session.attributes){
        message = session.attributes.message;
        }

    if(message){
        speechOutput ="Message app is closed";
        shouldEndSession = true;
    }
    else
        shouldEndSession = true;

    // Setting repromptText to null signifies that we do not want to reprompt the user.
    // If the user does not respond or says something that is not understood, the app session
    // closes.
    callback(sessionAttributes,buildSpeechletResponse(intent.name, speechOutput, repromptText, shouldEndSession));

}

function setMessageInSession(intent, session, callback){
    var message ="";
    var cardTitle = intent.name;
    var messageSlot = intent.slots.Message;
    console.log("messageSlot: "+messageSlot);

    var repromptText = "";
    var sessionAttributes = {};
    var shouldEndSession = false;
    var speechOutput = "";

    if(messageSlot){
        message = messageSlot.value;
        console.log("Mesage slot contains: " + message +".");
        sessionAttributes = createMessageAttributes(message);
        speechOutput = "your message has been sent. You can keep texting by saying send..."
        +"or finish message app by saying close message";
        repromptText = "you can keep texting by saying send..."+"or finish message app by saying close message";

        var message1 ;
        message1 = message.replace(/ /gi, '%20');

        console.log("replaced_message : ", message1);

        console.log("path::: ",+'/language/translate/v2?key='+k_google
            +'&source='+src
            +'&target='+t
            +'&q='+message1);

        var opt = {
            host: 'translation.googleapis.com',
            path: '/language/translate/v2?key='+k_google
                +'&source='+src
                +'&target='+t
                +'&q='+message1,
            method: 'GET',
            headers: {
              'connection': 'close'
            }
        };
        var msg = '';
        var req = https.request(opt, function(res) {
            console.log("statusCode from google: ", res.statusCode);
            //res.setEncoding('utf8');
            res.on('data', function (chunk) {
              msg += chunk;
              console.log('from google ... ',msg);
            });

            res.on('end',function(){
              console.log('from google',msg);
              toSlack(message,msg,callback, sessionAttributes, cardTitle, speechOutput, repromptText, shouldEndSession);
              //callback(sessionAttributes,
              //  buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
            });
        });
            req.end();
        }else {
            speechOutput = "I didn't hear your message clearly, please try again,";
            repromptText = "I didn't hear your message clearly, you can give me your "
                + "message by saying, send...";
            callback(sessionAttributes,
              buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
        }
  }

function createMessageAttributes(message){
    return {message : message  };
}
