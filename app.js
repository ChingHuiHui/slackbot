require("dotenv").config();

const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");

const { GraphQLClient, gql } = require("graphql-request");
const _ = require("lodash");
const moment = require("moment");

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;

const slackToken = process.env.SLACK_TOKEN;
const port = process.env.SLACK_PORT || 3000;

const slackEvents = createEventAdapter(slackSigningSecret);
const slackClient = new WebClient(slackToken);

const endpoint = "http://127.0.0.1:8000/graphql";
const client = new GraphQLClient(endpoint, { headers: {} });

const DEPARTMENT = {
  TECHNICAL: "TECHNICAL",
  DESIGN: "DESIGN",
  PM: "PM",
};

async function getList(type) {
  const query = gql`
    {
      events {
        id
        title
        department {
          id
          name
        }
        date
      }
    }
  `;

  let { events } = await client.request(query);

  // TODO: FIX
  const dictionary = {
    [DEPARTMENT.TECHNICAL]: "1",
    [DEPARTMENT.DESIGN]: "2",
    [DEPARTMENT.PM]: "3",
  };

  if (type) {
    events = events.filter(({ department: { id } }) => {
      return id === dictionary[type];
    });
  }

  return events.filter(({ date }) => moment(date).isSameOrAfter(new Date()));
}

function buildBlocks(list) {
  if (_.isEmpty(list)) {
    return [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "目前沒有任何讀書會",
        },
        accessory: {
          type: "button",
          text: {
            type: "plain_text",
            text: "Click Me",
            emoji: true,
          },
          value: "click_me_123",
          url: `http://127.0.0.1:8000/`,
          action_id: "button-action",
        },
      },
    ];
  }

  return _.map(list, ({ title, id, date, department }) => ({
    type: "section",
    text: {
      type: "mrkdwn",
      text: `• ID: ${id} / ${title} / ${department.name}部門 / ${date}`,
    },
    accessory: {
      type: "button",
      text: {
        type: "plain_text",
        text: "Click Me",
        emoji: true,
      },
      value: "click_me_123",
      url: `http://127.0.0.1:8000/events/${id}`,
      action_id: "button-action",
    },
  }));
}

async function sendMessage(options) {
  try {
    await slackClient.chat.postMessage(options);
  } catch (error) {
    console.log(error.data);
  }
}

slackEvents.on("app_mention", (event) => {
  const messageFromUser = event.text;
  const user = event.user;

  if (messageFromUser.includes("設計部讀書會")) {
    (async () => {
      const list = await getList(DEPARTMENT.DESIGN);

      sendMessage({
        channel: event.channel,
        blocks: buildBlocks(list),
      });
    })();

    return;
  }

  if (messageFromUser.includes("技術部讀書會")) {
    (async () => {
      const list = await getList(DEPARTMENT.TECHNICAL);

      sendMessage({
        channel: event.channel,
        blocks: buildBlocks(list),
      });
    })();

    return;
  }

  if (messageFromUser.includes("PM部讀書會")) {
    (async () => {
      const list = await getList(DEPARTMENT.PM);

      sendMessage({
        channel: event.channel,
        blocks: buildBlocks(list),
      });
    })();

    return;
  }

  if (messageFromUser.includes("讀書會")) {
    (async () => {
      const list = await getList();

      sendMessage({
        channel: event.channel,
        blocks: buildBlocks(list),
      });
    })();

    return;
  }

  if (messageFromUser.includes("我要參加")) {
    (async () => {
      const info = await slackClient.users.info({
        user: event.user,
      });
      console.log("info", info.user.profile);
      const bot = await slackClient.bots.info();

      console.log(
        await slackClient.conversations.members({ channel: event.channel })
      );
    })();

    // TODO: add into the list
    sendMessage({
      channel: event.channel,
      text: `Hello <@${user}>! YOU ARE IN :tada:`,
    });

    return;
  }

  if (messageFromUser.includes("我要退出")) {
    // TODO: add into the list
    sendMessage({
      channel: event.channel,
      text: `Bye <@${user}>! YOU ARE OUT :wave:`,
    });

    return;
  }

  sendMessage({
    channel: event.channel,
    text: `誒？ <@${user}>! 哩公啥？`,
  });
});

slackEvents.on("error", console.error);

slackEvents.start(port).then(() => {
  console.log(`Server started on port ${port}`);
});
