// Netlify Function for uploading products to Printful
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
    // Bearer Token 사용
    const BEARER_TOKEN = process.env.PRINTFUL_BEARER_TOKEN;
    
    if (!BEARER_TOKEN) {
      throw new Error('Printful Bearer token not configured');
    }

    // JSON 데이터 파싱
    const data = JSON.parse(event.body);
    const { productName, variantId, retailPrice, fileUrl } = data;

    if (!fileUrl || !productName || !variantId) {
      throw new Error('필수 필드가 누락되었습니다.');
    }

    console.log('제품 생성 시작...');
    
    const productData = {
      sync_product: {
        name: productName
      },
      sync_variants: [
        {
          retail_price: parseFloat(retailPrice) || 21.00,
          variant_id: parseInt(variantId),
          files: [
            {
              url: fileUrl,
              type: 'default'
            }
          ]
        }
      ]
    };

    const response = await fetch('https://api.printful.com/store/products', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BEARER_TOKEN}`,
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