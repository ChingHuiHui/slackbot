require('dotenv').config()

const { WebClient } = require('@slack/web-api')
const { createEventAdapter } = require('@slack/events-api')

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET

const slackToken = process.env.SLACK_TOKEN
const port = process.env.SLACK_PORT || 3000

const slackEvents = createEventAdapter(slackSigningSecret)
const slackClient = new WebClient(slackToken)

async function sendMessage({ channel, text }) {
  try {
    await slackClient.chat.postMessage({
      channel,
      text,
    })
  } catch (error) {
    console.log(error.data)
  }
}

slackEvents.on('app_mention', (event) => {
  const messageFromUser = event.text
  const user = event.user

  // TODO: get the user list
  if (messageFromUser.includes('設計部讀書會')) {
    sendMessage({
      channel: event.channel,
      text: `給你設計部讀書會清單`,
    })

    return
  }

  if (messageFromUser.includes('技術部讀書會')) {
    sendMessage({
      channel: event.channel,
      text: `給你技術部讀書會清單`,
    })

    return
  }

  if (messageFromUser.includes('PM部讀書會')) {
    sendMessage({
      channel: event.channel,
      text: `給你PM部讀書會清單`,
    })

    return
  }

  if (messageFromUser.includes('我要參加')) {
    ;(async () => {
      const info = await slackClient.users.info({
        user: event.user,
      })
      console.log('info', info.user.profile)
      const bot = await slackClient.bots.info()

      console.log(
        await slackClient.conversations.members({ channel: event.channel })
      )
    })()

    // TODO: add into the list
    sendMessage({
      channel: event.channel,
      text: `Hello <@${user}>! YOU ARE IN :tada:`,
    })

    return
  }

  if (messageFromUser.includes('我要退出')) {
    ;(async () => {
      console.log('info', info.user.profile)
    })()

    // TODO: add into the list
    sendMessage({
      channel: event.channel,
      text: `Bye <@${user}>! YOU ARE OUT :wave:`,
    })

    return
  }

  sendMessage({
    channel: event.channel,
    text: `誒？ <@${user}>! 哩公啥？`,
  })
})

slackEvents.on('error', console.error)

slackEvents.start(port).then(() => {
  console.log(`Server started on port ${port}`)
})
