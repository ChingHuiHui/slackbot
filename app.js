const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackToken = process.env.SLACK_TOKEN;
const port = process.env.SLACK_PORT || 3000;

const slackEvents = createEventAdapter(slackSigningSecret);
const slackClient = new WebClient(slackToken);

function sendMessage({ channel, text }) {
  (async () => {
    try {
      await slackClient.chat.postMessage({
        channel,
        text,
      });
    } catch (error) {
      console.log(error.data);
    }
  })();
}

slackEvents.on("app_mention", (event) => {
  const messageFromUser = event.text;
  const user = event.user;

  // TODO: get the user list
  if (messageFromUser.includes("給我名單")) {
    sendMessage({
      channel: event.channel,
      text: `蛤 給你拉`,
    });

    return;
  }

  if (!messageFromUser.toLowerCase().includes("參加")) {
    (async () => {
      const info = await slackClient.users.info({
        user: event.user,
      });
      console.log("info", info.user.profile);
    })();

    sendMessage({
      channel: event.channel,
      text: `誒？ <@${user}>! 哩公啥？`,
    });

    return;
  }

  // TODO: add into the list
  sendMessage({
    channel: event.channel,
    text: `Hello <@${user}>! YOU ARE IN :tada:`,
  });
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
  console.log(`Server started on port ${port}`);
});
