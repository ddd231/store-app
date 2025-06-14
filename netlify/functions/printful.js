// Netlify Function for Printful API proxy
exports.handler = async (event, context) => {
  // OAuth 자격 증명은 환경변수에서 가져옴
  const CLIENT_ID = process.env.PRINTFUL_CLIENT_ID;
  const SECRET_KEY = process.env.PRINTFUL_SECRET_KEY;
  
  if (!CLIENT_ID || !SECRET_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Printful credentials not configured' })
    };
  }

  const { path, method = 'GET', body } = event.queryStringParameters || {};
  
  // Basic Authentication 헤더 생성
  const authHeader = Buffer.from(`${CLIENT_ID}:${SECRET_KEY}`).toString('base64');
  
  try {
    const response = await fetch(`https://api.printful.com${path}`, {
      method,
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/json',
      },
      body: method !== 'GET' ? body : undefined,
    });

    const data = await response.json();
    
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify(data),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};