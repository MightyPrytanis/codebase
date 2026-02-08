// Global error handler - must be after all routes
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[HTTP Bridge] Error:', err);
  
  // Always return JSON in MCP format, never HTML
  res.status(err.status || err.statusCode || 500).json({
    content: [
      {
        type: 'text',
        text: `Error: ${err.message || 'Unknown error'}`,
      },
    ],
    isError: true,
  });
});