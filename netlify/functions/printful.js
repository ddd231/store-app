// Netlify Function for Printful API proxy
exports.handler = async (event, context) => {
  const PRINTFUL_API_KEY = process.env.PRINTFUL_API_KEY;
  
  if (!PRINTFUL_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Printful API key not configured' })
    };
  }

  const { path, method = 'GET', body } = event.queryStringParameters || {};
  
  try {
    const response = await fetch(`https://api.printful.com${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${PRINTFUL_API_KEY}`,
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