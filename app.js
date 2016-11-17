/*-----------------------------------------------------------------------------
This Bot uses the Bot Connector Service but is designed to showcase whats 
possible on Skype using the framework. The demo shows how to create a looping 
menu, use the built-in prompts, send Pictures, send Hero & Thumbnail Cards, 
send Receipts, and use Carousels. 

# RUN THE BOT:

    You can run the bot locally using the Bot Framework Emulator but for the best
    experience you should register a new bot on Skype and bind it to the demo 
    bot. You can then run the bot locally using ngrok found at https://ngrok.com/.

    * Install and run ngrok in a console window using "ngrok http 3978".
    * Create a bot on https://dev.botframework.com and follow the steps to setup
      a Skype channel.
    * For the endpoint you setup on dev.botframework.com, copy the https link 
      ngrok setup and set "<ngrok link>/api/messages" as your bots endpoint.
    * Next you need to configure your bots MICROSOFT_APP_ID, and
      MICROSOFT_APP_PASSWORD environment variables. If you're running VSCode you 
      can add these variables to your the bots launch.json file. If you're not 
      using VSCode you'll need to setup these variables in a console window.
      - MICROSOFT_APP_ID: This is the App ID assigned when you created your bot.
      - MICROSOFT_APP_PASSWORD: This was also assigned when you created your bot.
    * To use the bot you'll need to click the join link in the portal which will
      add it as a contact to your skype account. 
    * To run the bot you can launch it from VSCode or run "node app.js" from a 
      console window. 

-----------------------------------------------------------------------------*/

var restify = require('restify');
var builder = require('./core/');

//=========================================================
// Bot Setup 
//=========================================================

// Setup Restify Server
var server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 80, function () {
   console.log('%s listening to %s', server.name, server.url); 
});
  
// Create chat bot
var connector = new builder.ChatConnector({
    appId: '1adb6c46-d3ad-4a6c-bf2e-edc69df81338',
    appPassword: 'ViRRhcD9YtjKwo85EFjcXWE'
});
var bot = new builder.UniversalBot(connector);
server.post('/api/messages', connector.listen());


//=========================================================
// Activity Events
//=========================================================

bot.on('conversationUpdate', function (message) {
   // Check for group conversations
    if (message.address.conversation.isGroup) {
        // Send a hello message when bot is added
        if (message.membersAdded) {
            message.membersAdded.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                            .address(message.address)
                            .text("Hello everyone!");
                    bot.send(reply);
                }
            });
        }

        // Send a goodbye message when bot is removed
        if (message.membersRemoved) {
            message.membersRemoved.forEach(function (identity) {
                if (identity.id === message.address.bot.id) {
                    var reply = new builder.Message()
                        .address(message.address)
                        .text("Goodbye");
                    bot.send(reply);
                }
            });
        }
    }
});

bot.on('contactRelationUpdate', function (message) {
    if (message.action === 'add') {
        var name = message.user ? message.user.name : null;
        var reply = new builder.Message()
                .address(message.address)
                .text("Hello %s... Thanks very much for adding me. Say help for options.", name || 'there');
        bot.send(reply);
    } else {
        // delete their data
    }
});

bot.on('deleteUserData', function (message) {
    // User asked to delete their data
});


//=========================================================
// Bots Middleware
//=========================================================

// Anytime the major version is incremented any existing conversations will be restarted.
bot.use(builder.Middleware.dialogVersion({ version: 1.0, resetCommand: /^reset/i }));

//=========================================================
// Bots Global Actions
//=========================================================

bot.endConversationAction('end', 'MeetingEnd :)', { matches: /^end/i });
bot.beginDialogAction('help', '/help', { matches: /^help/i });

// Handle changes to the conversation participents
bot.on('conversationUpdate', function (message) {
    if (message.membersAdded) {
        var membersAdded = message.membersAdded
            .map((m) => {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        var reply = new builder.Message()
            .address(message.address)
            .text('Welcome ' + membersAdded);
        bot.send(reply);
        console.log('Added Members' + membersAdded)
    }

    if (message.membersRemoved) {
        var membersRemoved = message.membersRemoved
            .map((m) => {
                var isSelf = m.id === message.address.bot.id;
                return (isSelf ? message.address.bot.name : m.name) + ' (Id: ' + m.id + ')';
            })
            .join(', ');

        var reply = new builder.Message()
            .address(message.address)
            .text('The following members ' + membersRemoved + ' were removed or left the conversation :(');
        bot.send(reply);
        console.log('Removed Members' + membersRemoved)
    }
});

//=========================================================
// Bots Dialogs
//=========================================================

bot.dialog('/', [
    function (session) {
        // Send a greeting and show help.
        //var card = new builder.HeroCard(session)
        //    .title("Microsoft Bot Framework - Sykpe for business test bot")
        //    .text("Your bots - wherever your users are talking.")
        //    .images([
        //         builder.CardImage.create(session, "http://docs.botframework.com/images/demo_bot_image.png")
        //    ]);
        //var msg = new builder.Message(session).attachments([card]);
        //var msg = new builder.Message(session);
        //session.send(msg);
        //session.send("Hi... I'm the Microsoft Bot Framework demo for the Hackathon. I can show you everything you can use our Bot Builder SDK to do on Skype.");
        //session.send("Hi... I'm the Microsoft Bot Framework demo for the Hackathon. Type help  for more info.");
        if(session.message.text == 'help')
        {
            session.beginDialog('/help');
        }
        if(session.message.text == 'bill')
        {
            session.beginDialog('/receipt');
        }
        if(session.message.text == 'feedback')
        {
            session.beginDialog('/prompts');
        }
        if(session.message.text == 'start')
        {
            console.log('meeting started:' +  Date());
        }
        //session.beginDialog('/help');
    },
    function (session, results) {
        // Display menu
        //session.beginDialog('/menu');
    },
    function (session, results) {
        // Always say goodbye
        //session.send("Ok... See you later!");
    }
]);

bot.dialog('/menu', [
    function (session) {
        builder.Prompts.choice(session, "What demo would you like to run?", "prompts|picture|cards|list|carousel|receipt|actions|(quit)");
    },
    function (session, results) {
        if (results.response && results.response.entity != '(quit)') {
            // Launch demo dialog
            session.beginDialog('/' + results.response.entity);
        } else {
            // Exit the menu
            session.endDialog();
        }
    },
    //function (session, results) {
        // The menu runs a loop until the user chooses to (quit).
    //    session.replaceDialog('/menu');
   // }
]).reloadAction('reloadMenu', null, { matches: /^menu|show menu/i });

bot.dialog('/help', [
    function (session) {
        session.endDialog("Global commands that are available anytime:\n\n* bill - Show the current meeting bill.\n* goodbye - End this conversation.\n* help - Displays these commands.");
    }
]);

bot.dialog('/prompts', [
    function (session, results) {
        var style = builder.ListStyle.button;
        builder.Prompts.choice(session, "Prompts.choice()\n\nNow pick an option.", "great|ok|meh", { listStyle: style });
    },
    function (session, results) {
        session.send("You chose '%s'", results.response.entity);
        session.endDialog();
        //builder.Prompts.confirm(session, "Prompts.confirm()\n\nSimple yes/no questions are possible. Answer yes or no now.");
    },
    function (session, results) {
        var msg = new builder.Message(session);
        session.endDialog(msg);
    }
]);


bot.dialog('/cards', [
    function (session) {
        session.send("You can use Hero & Thumbnail cards to send the user visually rich information...");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Space_Needle"))
            ]);
        session.send(msg);

        msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.ThumbnailCard(session)
                    .title("Thumbnail Card")
                    .subtitle("Pikes Place Market")
                    .text("<b>Pike Place Market</b> is a public market overlooking the Elliott Bay waterfront in Seattle, Washington, United States.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/en/thumb/2/2a/PikePlaceMarket.jpg/320px-PikePlaceMarket.jpg")
                    ])
                    .tap(builder.CardAction.openUrl(session, "https://en.wikipedia.org/wiki/Pike_Place_Market"))
            ]);
        session.endDialog(msg);
    }
]);



bot.dialog('/receipt', [
    function (session) {       
        // Send a receipt without images
        msg = new builder.Message(session)
            .attachments([
                new builder.ReceiptCard(session)
                    .title("Recipient's Name")
                    .items([
                        builder.ReceiptItem.create(session, "$2200.00", "Chicago"),
                        builder.ReceiptItem.create(session, "$9999.00", "New York")
                    ])
                    .facts([
                        builder.Fact.create(session, "1234567898", "Meeting Id"),
                        builder.Fact.create(session, "CostCenter", "Delivery Method")
                    ])
                    .tax("$0.00")
                    .total("$12199.00")
            ]);
        session.endDialog(msg);
    }
]);

bot.dialog('/signin', [ 
    function (session) { 
        // Send a signin 
        var msg = new builder.Message(session) 
            .attachments([ 
                new builder.SigninCard(session) 
                    .text("You must first signin to your account.") 
                    .button("signin", "http://example.com/") 
            ]); 
        session.endDialog(msg); 
    } 
]); 


bot.dialog('/actions', [
    function (session) { 
        session.send("Bots can register global actions, like the 'help' & 'goodbye' actions, that can respond to user input at any time. You can even bind actions to buttons on a card.");

        var msg = new builder.Message(session)
            .textFormat(builder.TextFormat.xml)
            .attachments([
                new builder.HeroCard(session)
                    .title("Hero Card")
                    .subtitle("Space Needle")
                    .text("The <b>Space Needle</b> is an observation tower in Seattle, Washington, a landmark of the Pacific Northwest, and an icon of Seattle.")
                    .images([
                        builder.CardImage.create(session, "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Seattlenighttimequeenanne.jpg/320px-Seattlenighttimequeenanne.jpg")
                    ])
                    .buttons([
                        builder.CardAction.dialogAction(session, "weather", "Seattle, WA", "Current Weather")
                    ])
            ]);
        session.send(msg);

        session.endDialog("The 'Current Weather' button on the card above can be pressed at any time regardless of where the user is in the conversation with the bot. The bot can even show the weather after the conversation has ended.");
    }
]);

// Create a dialog and bind it to a global action
bot.dialog('/weather', [
    function (session, args) {
        session.endDialog("The weather in %s is 71 degrees and raining.", args.data);
    }
]);
bot.beginDialogAction('weather', '/weather');   // <-- no 'matches' option means this can only be triggered by a button.
