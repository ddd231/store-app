// Netlify Function for Printful Products API proxy
exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
  };

  // OPTIONS 요청 처리 (preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // OAuth 자격 증명
    const CLIENT_ID = process.env.PRINTFUL_CLIENT_ID;
    const SECRET_KEY = process.env.PRINTFUL_SECRET_KEY;
    
    if (!CLIENT_ID || !SECRET_KEY) {
      throw new Error('Printful credentials not configured');
    }

    // Basic Authentication 헤더 생성
    const authHeader = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');
    
    // Store Products API 호출 (실제 업로드된 제품들)
    const response = await fetch('https://api.printful.com/store/products', {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(data),
    };
  } catch (error) {
    console.error('Printful API 오류:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to fetch products',
        message: error.message 
      }),
    };
  }
};