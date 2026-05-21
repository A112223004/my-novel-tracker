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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7'
      },
      signal: AbortSignal.timeout(8000)
    });
    
    if (!response.ok) {
      throw new Error(`伺服器回應錯誤: ${response.status}`);
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // 🌟 【相容擴充】優化書名抓取（嘗試舊版結構、新版結構、或一般的 h1）
    let title = $('#info h1').text().trim() || $('.book-info h1').text().trim() || $('h1').first().text().trim() || '未知書名';
    
    // 如果不小心抓到包含空白或怪字元，稍微清理一下
    if (title.includes('\n')) {
      title = title.split('\n')[0].trim();
    }

    // 🌟 【相容擴充】優化作者、狀態、主角、分類抓取
    let author = '未知作者';
    let status = '已完結';
    let protagonist = '';
    let category = '';

    // 掃描全網頁所有的 p 標籤或 li 標籤，只要文字包含關鍵字就抓出來！
    $('p, li, div').each((i, el) => {
      const text = $(el).text().trim();
      
      if (text.startsWith('作者：') || text.includes('作者 :')) {
        author = text.replace(/作者：|作者 :/g, '').trim();
      }
      if (text.startsWith('狀態：') || text.includes('狀態 :') || text.includes('状态：')) {
        status = text.replace(/狀態：|狀態 :|状态：/g, '').trim();
      }
      if (text.includes('主角：') || text.includes('主角 :')) {
        protagonist = text.replace(/.*主角：|.*主角 :/g, '').trim();
      }
      if (text.includes('類別：') || text.includes('類別 :') || text.includes('类别：')) {
        category = text.replace(/.*類別：|.*類別 :|.*类别：/g, '').trim();
      }
    });

    // 如果還是有些老排版把作者藏在特定的 meta 裡，做最後防線捕捉
    if (author === '未知作者') {
      author = $('meta[property="og:novel:author"]').attr('content') || '未知作者';
    }
    if (title === '未知書名') {
      title = $('meta[property="og:title"]').attr('content') || '未知書名';
    }

    return NextResponse.json({ title, author, protagonist, category, status });
  } catch (error) {
    console.error('爬蟲崩潰原因:', error.message);
    return NextResponse.json({ error: '爬取失敗：' + error.message }, { status: 500 });
  }
}