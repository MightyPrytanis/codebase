fetch('http://localhost:5001/mcp/execute', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    tool: 'good_counsel',
    input: {
      context: 'Preparing for emergency TRO hearing tomorrow in Johnson v Johnson case',
      ai_provider: 'perplexity'
    }
  })
})
.then(response => response.json())
.then(data => console.log('Success:', JSON.stringify(data, null, 2)))
.catch(error => console.error('Error:', error));