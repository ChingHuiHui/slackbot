const { WebClient } = require("@slack/web-api");

const token = process.env.SLACK_TOKEN;

const web = new WebClient(token);

const { createEventAdapter } = require("@slack/events-api");
const slackEvents = createEventAdapter(process.env.SLACK_SIGNING_SECRET);
const port = process.env.PORT || 3000;

// Attach listeners to events by Slack Event "type". See: https://api.slack.com/events/message.im
slackEvents.on("message", (event) => {
  console.log("event.channel", event.channel);
  console.log(
    `Received a message event: user ${event.user} in channel ${event.channel} says ${event.text}`
  );
});

slackEvents.on("app_mention", (event) => {
  console.log("event.channel", event.channel);

  (async () => {
    // See: https://api.slack.com/methods/chat.postMessage
    const res = await web.chat.postMessage({
      channel: event.channel,
      text: "Hello there",
    });

    // `res` contains information about the posted message
    console.log("Message sent: ", res.ts);
  })();
});

// Handle errors (see `errorCodes` export)
slackEvents.on("error", console.error);

// Start a basic HTTP server
slackEvents.start(port).then(() => {
  // Listening on path '/slack/events' by default
  console.log(`server listening on port ${port}`);
});
