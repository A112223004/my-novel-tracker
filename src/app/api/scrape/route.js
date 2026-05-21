import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: '請提供網址' }, { status: 400 });
  }

  try {
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      timeout: 8000
    });

    const $ = cheerio.load(response.data);

    // === 新版半夏小說精準元數據抓取 ===
    
    // 1. 從 <title> 或是 description 抓取書名與作者
    const pageTitle = $('title').text().trim(); // 例如: "反派大佬讓我重生後救他, 反派大佬讓我重生後救他小說..."
    let title = pageTitle.split(',')[0].trim() || '未知書名';
    
    // 2. 從 description 標籤精準切出作者和分類
    // 格式通常是: "反派大佬讓我重生後救他_春風榴火_穿越重生，..."
    const description = $('meta[name="description"]').attr('content') || '';
    
    let author = '未知作者';
    let category = '其他';
    let protagonist = '無紀錄'; // 半夏的 meta 沒有主角，我們一樣先留空

    if (description.includes('_')) {
      const parts = description.split('_');
      if (parts.length >= 3) {
        author = parts[1].trim();     // 第二段是作者 (如: 春風榴火)
        category = parts[2].split('，')[0].split(',')[0].trim(); // 第三段開頭是分類 (如: 穿越重生)
      }
    }

    // 3. 嘗試在內文撈撈看有沒有主角資料 (從簡介或內容區塊)
    $('p, div, li').each((i, el) => {
      const text = $(el).text().trim();
      if (text.includes('主角：') || text.includes('主角:')) {
        const match = text.match(/(?:主角：|主角:)\s*([^\s┃,，、]+)/);
        if (match && match[1]) {
          protagonist = match[1].trim();
        }
      }
    });

    return NextResponse.json({
      title,
      author,
      protagonist,
      category,
      novel_url: targetUrl
    });

  } catch (error) {
    console.error('半夏新版爬蟲出錯:', error.message);
    return NextResponse.json({ error: '無法抓取資料', details: error.message }, { status: 500 });
  }
}