import puppeteer from "puppeteer";

const YOUTUBE_LINK = 'https://www.youtube.com';

export const check_url = async (message: string) => {
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    try{
        const page_status = await page.goto(YOUTUBE_LINK + message);
        return page_status.status();
    }catch(e){
        console.log(e);
    }finally{
        if(page) await page.close();
        if(browser) await browser.close();
    }
}