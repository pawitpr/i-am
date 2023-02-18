const WebSocket = require('ws')
const Discord = require('discord.js')
const fetch = require('node-fetch')
require('dotenv').config()
const express = require('express')
const app = express();
const port = 3000

const client = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES]
})

var bot
var body
var wsLink

function newError(text, error) {
    return new Error(`\x1b[33m${text}: \x1b[101m${error}\x1b[0m`)
}

(function () {
    const socket = new WebSocket('wss://chai-959f8-default-rtdb.firebaseio.com/.ws?v=5')
    try {
        socket.onopen = () => {
            socket.onmessage = (event) => {
                wsLink = JSON.parse(event.data).d.d.h
            }
        }
    } catch (error) {
        throw newError('Error while connecting to websocket', error)
    }
}())

client.once('ready', () => {

    console.log(`Loaded Discord bot: ${client.user.tag}`)

    try {
        const socket = new WebSocket(`wss://${wsLink}/.ws?v=5&ns=chai-959f8-default-rtdb`)

        socket.onopen = () => {
            socket.send(JSON.stringify({ "t": "d", "d": { "r": 2, "a": "q", "b": { "p": "/botConfigs/bots/" + process.env.CHAI_BOT_ID, "h": "" } } }))
            socket.onmessage = (event) => {
                if (JSON.parse(event.data).d.b?.p) {
                    bot = JSON.parse(event.data).d.b.d

                    body = {
                        "text": `${bot.prompt}\n${bot.botLabel}: ${bot.firstMessage}`,
                        "temperature": bot.temperature,
                        "repetition_penalty": bot.repetitionPenalty,
                        "model": bot.model,
                        "top_p": bot.topP,
                        "top_k": bot.topK,
                        "response_length": bot.responseLength,
                        "stop_sequences": [
                            "\n",
                            `${bot.botLabel}:`,
                            `${bot.userLabel}:`
                        ]
                    }
                    console.log(`Fetched bot data: ${bot.name}`)
                }
            }
        }
    } catch (error) {
        throw newError('Error while connecting to websocket', error)
    }
})

client.on('messageCreate', message => {
    if (message.author.bot || message.channel.id != "1076275488047243396" || !bot) return

    body.text += `\n${bot.userLabel}: ${message}\n${bot.botLabel}:`
    message.channel.sendTyping()

    fetch("https://model-api-shdxwd54ta-nw.a.run.app/generate/gptj", {
        "headers": {
            "content-type": "application/json",
            "developer_key": "2sMw-6eDQmQHXn_1WVVq6vUt5kpJZRXkEwHW6VBxMWI6g3KO03hHTDmbKEBp1DpRGyoz3Jo-Lb4t0RW-AjmeCw", // dev 
            "developer_uid": "F8hXeIh55BRG0eNOGDD1C8wqel83",
        },
        "body": JSON.stringify(body),
        "method": "POST"
    }).then(res => res.json()).then(d => {

        if (d.error) throw newError('Error while fetching response', d.error.message)

        body.text += d.data

        message.reply({
            content: d.data
        }).catch(error => {
            throw newError('Error while sending message', error)
        })
    })
})

client.login("MTA3NTAzNjA5MDMzMjg4OTExMA.GygbAE.fdnX6ElEGbWvSn3difEfQf53Q4-Y-srhwayUvg")
app.get('/', (req, res) => res.send('Works!'))

app.listen(port, () =>
console.log(`Your app is listening a http://localhost:${port}`)
);