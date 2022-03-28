const { request } = require('https')
const { writeFileSync, readFileSync } = require('fs')

const express = require('express')
const { load } = require('cheerio')

const app = express()

let html = ''

function scraping() {
    html = ''

    const options = {
        // hostname: 'luckbox.com',
        // path: '/matches',

        hostname: 'www.rivalry.com',
        path: '/esports',

        // hostname: 'www.bitsler.com',
        // path: '/fr/esports',

        method: 'GET',
        headers: {
            'Accept': 'text/html'
        }
    }

    const reqScraping = request(options, resScraping => {
        console.log(`statusCode: ${resScraping.statusCode}`)

        resScraping.on('data', d => html += d)
    })

    reqScraping.on('error', error => {
        console.error(error)
    })

    reqScraping.end()
}

setInterval(scraping, 60 * 1000)
scraping()

async function index(req, res) {
    const $ = await load(html)

    const content = $('.betline')

    const tournaments = $(content, '.text-league-of-legends-shade')
    let htmlFile = $.html(tournaments).toString()

    htmlFile += `
        <script>
            const betlines = document.querySelectorAll('.betline')
            let json = []
            
            betlines.forEach(function (betline) {
                if (betline.children.length) {
                    const tournament = betline.children[0].children[1].children[0].innerText
                    
                    const team1 = betline.querySelector('.right-facing-competitor .outcome-name').innerText
                    const team2 = betline.querySelector('.left-facing-competitor .outcome-name').innerText
                    
                    const teamOutcome1 = betline.querySelector('.right-facing-competitor .outcome-odds').innerText
                    const teamOutcome2 = betline.querySelector('.left-facing-competitor .outcome-odds').innerText
                    
                    json.push({
                        tournament,
                         teams: [
                             { team1, teamOutcome1 },
                             { team2, teamOutcome2 }
                         ]
                    })
                }
            })
            
            document.body.innerHTML = '<pre>' + JSON.stringify(json, null, 2) + '</pre>'
        </script>
    `

    res.setHeader('Content-Type', 'text/html')
    writeFileSync('indexes.html', htmlFile)
    console.log(("File written successfully\n"))
    console.log(("The written has the following contents:"))
    res.write(readFileSync('indexes.html', 'utf8'))
    res.end()
}

function indexes(req, res) {
    res.write(readFileSync('indexes.html', 'utf8'))
    res.end()
}

app.get('/', index)
app.get('/indexes', indexes)

app.listen(8000, function () {
    console.log('Server listening at: http://localhost:8000.')
})
