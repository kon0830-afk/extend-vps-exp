import puppeteer from 'puppeteer'
import { setTimeout } from 'node:timers/promises'

const args = ['--no-sandbox', '--disable-setuid-sandbox']
if (process.env.PROXY_SERVER) {
    const proxy_url = new URL(process.env.PROXY_SERVER)
    proxy_url.username = ''
    proxy_url.password = ''
    args.push(`--proxy-server=${proxy_url}`.replace(/\/$/, ''))
}

const browser = await puppeteer.launch({
    defaultViewport: { width: 1080, height: 1024 },
    args,
})
const [page] = await browser.pages()
const userAgent = await browser.userAgent()
await page.setUserAgent(userAgent.replace('Headless', ''))
const recorder = await page.screencast({ path: 'recording.webm' })

try {
    if (process.env.PROXY_SERVER) {
        const { username, password } = new URL(process.env.PROXY_SERVER)
        if (username && password) {
            await page.authenticate({ username, password })
        }
    }

    await page.goto('https://secure.xserver.ne.jp/xapanel/login/xvps/', { waitUntil: 'networkidle2' })
    await page.locator('#memberid').fill(process.env.EMAIL)
    await page.locator('#user_password').fill(process.env.PASSWORD)
    await page.locator('text=ログインする').click()
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    const targetUrl = "https://secure.xserver.ne.jp/xapanel/xvps/server/freevps/extend/index?id_vps=40148846"
    
    // 直接目的のページへジャンプ
    await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 })
    
//    await page.goto('https://secure.xserver.ne.jp/xapanel/xvps/index', { waitUntil: 'networkidle2' })    //2026/3/8追加
//    await page.locator('a[href^="/xapanel/xvps/server/detail?id="]').click()
//    await page.locator('text=更新する').click()
//    const updateBtn = 'a[href*="freevps/extend"]'
//    await page.waitForSelector(updateBtn, { visible: true, timeout: 30000 })
//    await page.click(updateBtn)
//    await page.waitForSelector(detailLink, { visible: true, timeout: 30000 });
    
    // 一番確実なのは、最初に見つかった「有効な」リンクをクリックすることです
//    await page.$$eval(detailLink, els => els[0].click());    
//    await page.waitForNavigation({ waitUntil: 'networkidle2' }).catch(() => {});
    
    await page.locator('text=引き続き無料VPSの利用を継続する').click()
    await page.waitForNavigation({ waitUntil: 'networkidle2' })
    const body = await page.$eval('img[src^="data:"]', img => img.src)
    const code = await fetch('https://captcha-120546510085.asia-northeast1.run.app', { method: 'POST', body }).then(r => r.text())
    await page.locator('[placeholder="上の画像の数字を入力"]').fill(code)
    await page.locator('text=無料VPSの利用を継続する').click()
} catch (e) {
    console.error(e)
} finally {
    await setTimeout(5000)
    await recorder.stop()
    await browser.close()
}
