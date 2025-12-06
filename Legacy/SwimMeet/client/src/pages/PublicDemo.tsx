import React from 'react';
import logoImage from '@assets/SwimMeet Logo 3_1755934092349.png';
import '../styles/glass-ocean.css';

export function PublicDemo() {
  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      fontFamily: '"SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      background: 'linear-gradient(180deg, #0A1A2A 0%, #1E3A5F 60%, #2C5282 100%)',
      color: '#FFFFFF',
      lineHeight: '1.4',
      overflowX: 'hidden'
    }}>
      {/* Underwater caustics layer */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
        opacity: 0.04,
        backgroundImage: `
          linear-gradient(45deg, transparent 30%, #60A5FA 31%, #60A5FA 33%, transparent 34%),
          linear-gradient(-45deg, transparent 30%, #60A5FA 31%, #60A5FA 33%, transparent 34%),
          linear-gradient(90deg, transparent 45%, rgba(255,255,255,0.1) 46%, rgba(255,255,255,0.1) 48%, transparent 49%)
        `,
        backgroundSize: '60px 60px, 60px 60px, 120px 120px',
        animation: 'caustics-flow 25s linear infinite'
      }}></div>
      
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, rgba(44, 82, 130, 0.9) 0%, rgba(30, 58, 95, 0.95) 100%)',
        backdropFilter: 'blur(20px) saturate(120%)',
        borderBottom: '2px solid rgba(255, 255, 255, 0.15)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.4)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div style={{ 
          maxWidth: '1400px', 
          margin: '0 auto', 
          textAlign: 'center', 
          padding: '32px 24px'
        }}>
          <img 
            src={logoImage} 
            alt="SwimMeet Logo" 
            style={{ 
              height: '120px', 
              transform: 'scaleX(1.20)',
              filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.3))'
            }}
          />
          <h1 style={{ 
            margin: '24px 0 12px 0', 
            fontSize: '48px', 
            fontWeight: '700',
            color: '#FFFFFF',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)',
            letterSpacing: '0.02em'
          }}>
            SwimMeet
          </h1>
          <p style={{ 
            margin: 0, 
            fontSize: '20px', 
            color: '#94A3B8',
            fontWeight: '400',
            letterSpacing: '0.01em'
          }}>
            Advanced AI Orchestration Platform
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ 
        maxWidth: '1400px', 
        margin: '0 auto', 
        padding: '48px 24px',
        position: 'relative',
        zIndex: 10
      }}>
        
        {/* Platform Overview */}
        <section style={{ 
          marginBottom: '80px', 
          textAlign: 'center',
          background: 'rgba(255, 255, 255, 0.08)',
          backdropFilter: 'blur(20px) saturate(120%)',
          border: '2px solid rgba(255, 255, 255, 0.15)',
          padding: '48px 32px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
        }}>
          <h2 style={{ 
            fontSize: '42px', 
            marginBottom: '24px', 
            color: '#FFFFFF',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            🏊‍♂️ Multi-AI Orchestration Platform
          </h2>
          <p style={{ 
            fontSize: '22px', 
            lineHeight: '1.6', 
            maxWidth: '900px', 
            margin: '0 auto', 
            color: '#94A3B8',
            fontWeight: '400',
            letterSpacing: '0.01em'
          }}>
            SwimMeet enables simultaneous querying of multiple AI services with advanced response management, 
            fact-checking capabilities, and collaborative workflows. Think of it as conducting an orchestra 
            of AI assistants working together on your challenges.
          </p>
        </section>

        {/* Three Modes */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '38px', 
            marginBottom: '48px', 
            textAlign: 'center', 
            color: '#FFFFFF',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            Three Powerful Modes
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
            gap: '32px'
          }}>
            
            {/* DIVE Mode */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid #2563EB',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #2563EB, #60A5FA)',
              }}></div>
              <h3 style={{ 
                color: '#60A5FA', 
                fontSize: '28px', 
                marginBottom: '20px',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                🏊‍♂️ DIVE Mode
              </h3>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '24px',
                color: '#94A3B8',
                fontWeight: '400'
              }}>
                Simultaneous multi-AI querying. Submit your question to multiple AI providers 
                at once and compare their responses side-by-side.
              </p>
              <div style={{ 
                background: 'rgba(37, 99, 235, 0.15)', 
                padding: '20px', 
                fontSize: '16px',
                border: '1px solid rgba(37, 99, 235, 0.3)',
                color: '#FFFFFF'
              }}>
                <strong style={{ color: '#60A5FA' }}>Example:</strong> "Analyze the impact of remote work on productivity"
                <br /><br />
                <strong style={{ color: '#60A5FA' }}>Result:</strong> Get perspectives from ChatGPT-4, Claude 4, Gemini Pro, 
                and Perplexity simultaneously, with quality ratings and response time tracking.
              </div>
            </div>

            {/* TURN Mode */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid #7C3AED',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #7C3AED, #A855F7)',
              }}></div>
              <h3 style={{ 
                color: '#A855F7', 
                fontSize: '28px', 
                marginBottom: '20px',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                🔄 TURN Mode
              </h3>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '24px',
                color: '#94A3B8',
                fontWeight: '400'
              }}>
                AI-to-AI fact-checking and verification. Select a verifier AI to critique 
                and score the accuracy of other AI responses.
              </p>
              <div style={{ 
                background: 'rgba(124, 58, 237, 0.15)', 
                padding: '20px', 
                fontSize: '16px',
                border: '1px solid rgba(124, 58, 237, 0.3)',
                color: '#FFFFFF'
              }}>
                <strong style={{ color: '#A855F7' }}>Example:</strong> Get ChatGPT's analysis of climate data, then have Claude 
                fact-check it for accuracy, providing scores and identifying any errors.
                <br /><br />
                <strong>Result:</strong> Accuracy scores, factual error identification, and improvement recommendations.
              </div>
            </div>

            {/* WORK Mode */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.08)',
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid #059669',
              padding: '32px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                right: '0',
                height: '4px',
                background: 'linear-gradient(90deg, #059669, #10B981)',
              }}></div>
              <h3 style={{ 
                color: '#10B981', 
                fontSize: '28px', 
                marginBottom: '20px',
                fontWeight: '600',
                letterSpacing: '0.01em'
              }}>
                ⚙️ WORK Mode
              </h3>
              <p style={{ 
                fontSize: '18px', 
                lineHeight: '1.6', 
                marginBottom: '24px',
                color: '#94A3B8',
                fontWeight: '400'
              }}>
                Sequential AI collaboration. Multiple AIs work together in stages, 
                building on each other's work to create comprehensive solutions.
              </p>
              <div style={{ 
                background: 'rgba(5, 150, 105, 0.15)', 
                padding: '20px', 
                fontSize: '16px',
                border: '1px solid rgba(5, 150, 105, 0.3)',
                color: '#FFFFFF'
              }}>
                <strong style={{ color: '#10B981' }}>Example:</strong> "Develop a marketing strategy for a new product"
                <br /><br />
                <strong style={{ color: '#10B981' }}>Workflow:</strong> Step 1 (OpenAI): Market analysis → Step 2 (Anthropic): Strategy development → Step 3 (Google): Implementation plan
              </div>
            </div>
          </div>
        </section>

        {/* Live Statistics */}
        <section style={{ marginBottom: '80px' }}>
          <h2 style={{ 
            fontSize: '38px', 
            marginBottom: '48px', 
            textAlign: 'center', 
            color: '#FFFFFF',
            fontWeight: '700',
            letterSpacing: '0.02em',
            textShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            Platform Statistics
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
            textAlign: 'center'
          }}>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              padding: '32px 24px', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#60A5FA', marginBottom: '8px' }}>8</div>
              <div style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '500' }}>AI Providers</div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              padding: '32px 24px', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#10B981', marginBottom: '8px' }}>4</div>
              <div style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '500' }}>Active Connections</div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              padding: '32px 24px', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#A855F7', marginBottom: '8px' }}>∞</div>
              <div style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '500' }}>Conversations</div>
            </div>
            <div style={{ 
              background: 'rgba(255, 255, 255, 0.08)', 
              backdropFilter: 'blur(20px) saturate(120%)',
              border: '2px solid rgba(255, 255, 255, 0.15)',
              padding: '32px 24px', 
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
            }}>
              <div style={{ fontSize: '48px', fontWeight: '700', color: '#FFFFFF', marginBottom: '8px' }}>24/7</div>
              <div style={{ fontSize: '16px', color: '#94A3B8', fontWeight: '500' }}>Availability</div>
            </div>
          </div>
        </section>

        {/* Sample Response Display */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center', color: '#ffd700' }}>
            Sample AI Response Analysis
          </h2>
          
          <div style={{ background: 'rgba(0, 0, 0, 0.3)', padding: '30px', backdropFilter: 'blur(10px)' }}>
            <div style={{ marginBottom: '20px', fontSize: '18px', fontWeight: 'bold' }}>
              Query: "What are the key trends in sustainable technology for 2025?"
            </div>
            
            <div style={{ display: 'grid', gap: '20px' }}>
              
              {/* ChatGPT Response */}
              <div style={{ 
                background: 'rgba(37, 99, 235, 0.2)', 
                border: '1px solid #2563EB', 
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ color: '#2563EB' }}>ChatGPT-4</strong>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: '#16a34a', padding: '2px 8px', fontSize: '12px' }}>95% Positive</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>2.3s</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  Key sustainable technology trends for 2025 include advanced battery storage systems, 
                  green hydrogen production scaling, circular economy automation, and AI-optimized energy grids. 
                  Carbon capture technologies are becoming economically viable...
                </p>
              </div>

              {/* Claude Response */}
              <div style={{ 
                background: 'rgba(124, 58, 237, 0.2)', 
                border: '1px solid #7C3AED', 
                padding: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <strong style={{ color: '#7C3AED' }}>Claude 4</strong>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span style={{ background: '#16a34a', padding: '2px 8px', fontSize: '12px' }}>92% Positive</span>
                    <span style={{ fontSize: '12px', opacity: 0.8 }}>1.8s</span>
                  </div>
                </div>
                <p style={{ fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                  The sustainable tech landscape in 2025 will be dominated by breakthrough materials science, 
                  particularly in biodegradable plastics and next-generation solar cells. Fusion energy 
                  pilot programs are entering commercial testing phases...
                </p>
              </div>

              {/* Verification Results */}
              <div style={{ 
                background: 'rgba(255, 215, 0, 0.2)', 
                border: '1px solid #ffd700', 
                padding: '20px'
              }}>
                <div style={{ marginBottom: '12px' }}>
                  <strong style={{ color: '#ffd700' }}>TURN Verification Results</strong>
                </div>
                <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Accuracy Score:</strong> 94% (Both responses factually sound)
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Strengths:</strong> Current technology trends correctly identified, realistic timelines
                  </div>
                  <div style={{ marginBottom: '8px' }}>
                    <strong>Areas for Improvement:</strong> Could include more specific cost projections
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Features */}
        <section style={{ marginBottom: '60px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '30px', textAlign: 'center', color: '#ffd700' }}>
            Technical Capabilities
          </h2>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🔐 Enterprise Security</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                JWT authentication, bcrypt password hashing, disposable access tokens, 
                and comprehensive session management with admin controls.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>📊 Advanced Analytics</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Real-time performance tracking, response quality scoring, provider reliability metrics, 
                and comprehensive conversation history.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🔄 Workflow Engine</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Intelligent step planning, sequential AI collaboration, progress monitoring, 
                and automatic handoffs between providers.
              </p>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '20px', backdropFilter: 'blur(10px)' }}>
              <h4 style={{ color: '#39cccc', marginBottom: '12px' }}>🌐 Platform Independence</h4>
              <p style={{ fontSize: '14px', lineHeight: '1.5' }}>
                Standard technologies (PostgreSQL, JWT, bcrypt) with zero proprietary dependencies. 
                Complete portability across platforms.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '20px', color: '#ffd700' }}>
            Experience SwimMeet
          </h2>
          <p style={{ fontSize: '18px', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 30px auto' }}>
            This is a completely public demo page designed for AI assistants to understand SwimMeet's capabilities. 
            The full platform includes user authentication, persistent conversations, and advanced workflow management.
          </p>
          <div style={{
            background: 'rgba(255, 215, 0, 0.2)',
            border: '2px solid #ffd700',
            padding: '20px',
            maxWidth: '600px',
            margin: '0 auto',
            backdropFilter: 'blur(10px)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', color: '#ffd700' }}>AI Analysis Note</h4>
            <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.5' }}>
              This public demo page is specifically designed to be accessible to AI assistants via web_fetch. 
              The full SwimMeet platform requires authentication and provides persistent data storage, 
              user management, and advanced AI orchestration capabilities.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        background: 'rgba(0, 31, 63, 0.9)',
        padding: '20px 0',
        textAlign: 'center',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
          SwimMeet - Advanced AI Orchestration Platform | Built with React, TypeScript, and PostgreSQL
        </p>
      </footer>
    </div>
  );
}