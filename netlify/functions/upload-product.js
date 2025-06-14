// Netlify Function for uploading products to Printful
const multipart = require('lambda-multipart-parser');

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // OAuth 자격 증명
    const CLIENT_ID = process.env.PRINTFUL_CLIENT_ID;
    const SECRET_KEY = process.env.PRINTFUL_SECRET_KEY;
    
    if (!CLIENT_ID || !SECRET_KEY) {
      throw new Error('Printful credentials not configured');
    }

    // Basic Authentication 헤더
    const authHeader = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');

    // Multipart 데이터 파싱
    const result = await multipart.parse(event);
    const { productName, variantId, retailPrice } = result;
    const file = result.file;

    if (!file || !productName || !variantId) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    // 1단계: 파일을 Printful 파일 라이브러리에 업로드
    console.log('파일 업로드 시작...');
    
    // 파일을 Base64로 인코딩
    const fileBuffer = Buffer.from(file.content, 'binary');
    const base64File = fileBuffer.toString('base64');
    
    // 임시 URL 생성 (실제로는 클라우드 스토리지 사용 권장)
    const tempUrl = `data:${file.contentType};base64,${base64File}`;

    // 2단계: Printful에 제품 생성
    console.log('제품 생성 시작...');
    
    const productData = {
      sync_product: {
        name: productName,
        thumbnail: tempUrl
      },
      sync_variants: [
        {
          retail_price: parseFloat(retailPrice) || 21.00,
          variant_id: parseInt(variantId),
          files: [
            {
              url: tempUrl,
              type: 'default'
            }
          ]
        }
      ]
    };

    const response = await fetch('https://api.printful.com/store/products', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(productData)
    });

    const responseData = await response.json();
    
    if (!response.ok) {
      console.error('Printful API 오류:', responseData);
      throw new Error(responseData.error?.message || 'Printful API 오류');
    }

    console.log('제품 생성 성공:', responseData);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        product: responseData.result
      })
    };

  } catch (error) {
    console.error('업로드 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message || 'Unknown error occurred'
      })
    };
  }
};