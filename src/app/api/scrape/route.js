import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: '請提供網址' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        // 強化偽裝：偽裝成更像一般真實台灣使用者的 Chrome 瀏覽器
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache'
      },
      // 設定連線超時，避免卡死
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`伺服器回應錯誤代碼: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const title = $('#info h1').text().trim() || '未知書名';
    const author = $('#info p').eq(0).text().replace('作者：', '').trim() || '未知作者';
    const status = $('#info p').eq(1).text().replace('狀態：', '').trim() || '未知狀態';
    
    let protagonist = '';
    let category = '';
    $('#info p').each((i, el) => {
      const text = $(el).text();
      if (text.includes('主角：')) protagonist = text.replace('主角：', '').trim();
      if (text.includes('類別：')) category = text.replace('類別：', '').trim();
    });

    return NextResponse.json({ title, author, protagonist, category, status });
  } catch (error) {
    // 這行會在 Vercel 的後台日誌印出到底是 403 被擋、還是連線超時，方便我們抓兇手
    console.error('爬蟲崩潰原因:', error.message);
    return NextResponse.json({ error: '爬取失敗：' + error.message }, { status: 500 });
  }
}