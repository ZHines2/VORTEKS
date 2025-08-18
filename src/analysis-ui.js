// analysis-ui.js
// VORTEKS Game Analysis UI Component

import { analyzeGameStates, analyzeTurnPatterns, analyzeCardEffectiveness, analyzeStrategicOpportunities } from './game-analysis.js';

export class AnalysisUI {
  constructor() {
    this.currentView = 'overview';
  }

  // Create the main analysis UI
  createAnalysisPanel() {
    const panel = document.createElement('div');
    panel.id = 'analysis-panel';
    panel.className = 'analysis-panel';
    panel.innerHTML = `
      <div class="analysis-header">
        <h2>🔍 VORTEKS Strategic Analysis</h2>
        <div class="analysis-tabs">
          <button class="tab-btn active" data-view="overview">Overview</button>
          <button class="tab-btn" data-view="turns">Turn Analysis</button>
          <button class="tab-btn" data-view="cards">Card Synergies</button>
          <button class="tab-btn" data-view="opportunities">Opportunities</button>
          <button class="tab-btn" data-view="insights">Design Insights</button>
        </div>
        <button class="close-btn" onclick="this.parentElement.parentElement.style.display='none'">×</button>
      </div>
      <div class="analysis-content" id="analysis-content">
        Loading analysis...
      </div>
    `;

    // Add event listeners
    const tabs = panel.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this.currentView = e.target.dataset.view;
        this.updateContent();
      });
    });

    return panel;
  }

  // Update the content based on current view
  updateContent() {
    const content = document.getElementById('analysis-content');
    if (!content) return;

    switch (this.currentView) {
      case 'overview':
        content.innerHTML = this.renderOverview();
        break;
      case 'turns':
        content.innerHTML = this.renderTurnAnalysis();
        break;
      case 'cards':
        content.innerHTML = this.renderCardAnalysis();
        break;
      case 'opportunities':
        content.innerHTML = this.renderOpportunities();
        break;
      case 'insights':
        content.innerHTML = this.renderDesignInsights();
        break;
    }
  }

  renderOverview() {
    const analysis = analyzeGameStates();
    
    return `
      <div class="overview-grid">
        <div class="metric-card">
          <h3>🎯 Strategic Efficiency</h3>
          <div class="metric-value">${(analysis.strategicDepth.strategicDiversity * 100).toFixed(1)}%</div>
          <p>Card type diversity in your playstyle</p>
        </div>
        
        <div class="metric-card">
          <h3>⚡ Turn Optimization</h3>
          <div class="metric-value">${(analysis.turnDistribution.efficiency.energyEfficiency * 100).toFixed(1)}%</div>
          <p>Percentage of turns using all energy</p>
        </div>
        
        <div class="metric-card">
          <h3>🔄 Echo Mastery</h3>
          <div class="metric-value">${(analysis.turnDistribution.efficiency.echoUtilization * 100).toFixed(1)}%</div>
          <p>Echo cards per turn (higher = better combos)</p>
        </div>
        
        <div class="metric-card">
          <h3>🎲 Risk Tolerance</h3>
          <div class="metric-value">${(analysis.strategicDepth.riskRewardProfile.riskTolerance * 100).toFixed(1)}%</div>
          <p>Usage of high-risk, high-reward cards</p>
        </div>
      </div>
      
      <div class="insights-summary">
        <h3>📊 Key Insights</h3>
        <div class="insight-list">
          ${analysis.turnDistribution.insights.map(insight => 
            `<div class="insight-item">💡 ${insight}</div>`
          ).join('')}
        </div>
      </div>
      
      <div class="opportunities-preview">
        <h3>🚀 Top Opportunities</h3>
        ${analysis.missedOpportunities.slice(0, 3).map(opp => `
          <div class="opportunity-card ${opp.impact}">
            <strong>${opp.area}</strong>
            <p>${opp.insight}</p>
            <span class="impact-badge">${opp.impact} impact</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  renderTurnAnalysis() {
    const turnAnalysis = analyzeTurnPatterns();
    
    return `
      <div class="turn-analysis">
        <h3>🔄 Turn Distribution Analysis</h3>
        
        <div class="efficiency-metrics">
          <div class="metric-row">
            <span>Average Cards Per Turn:</span>
            <span class="metric-value">${turnAnalysis.efficiency.avgCardsPerTurn?.toFixed(1) || '0.0'}</span>
          </div>
          <div class="metric-row">
            <span>Average Energy Per Turn:</span>
            <span class="metric-value">${turnAnalysis.efficiency.avgEnergyPerTurn?.toFixed(1) || '0.0'}</span>
          </div>
          <div class="metric-row">
            <span>Perfect Turn Rate:</span>
            <span class="metric-value">${(turnAnalysis.patterns.perfectTurnRate * 100).toFixed(1)}%</span>
          </div>
          <div class="metric-row">
            <span>Echo Strategic Value:</span>
            <span class="metric-value">${turnAnalysis.patterns.echoStrategicValue.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="turn-patterns">
          <h4>🎯 Optimal Turn Composition</h4>
          <div class="pattern-card">
            <strong>Estimated Optimal:</strong> ${turnAnalysis.patterns.optimalTurnComposition.estimatedOptimal} cards
            <br>
            <strong>Your Maximum:</strong> ${turnAnalysis.patterns.optimalTurnComposition.actualMax} cards
            <br>
            <strong>Efficiency Score:</strong> ${turnAnalysis.patterns.optimalTurnComposition.efficiency.toFixed(2)} damage per energy
          </div>
        </div>
        
        <div class="recommendations">
          <h4>💡 Turn Strategy Recommendations</h4>
          ${turnAnalysis.insights.map(insight => 
            `<div class="recommendation-item">🎯 ${insight}</div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  renderCardAnalysis() {
    const cardAnalysis = analyzeCardEffectiveness();
    
    return `
      <div class="card-analysis">
        <h3>🃏 Card Synergy Analysis</h3>
        
        <div class="synergy-grid">
          <div class="synergy-card">
            <h4>⭐ Focus + Attack Synergy</h4>
            <div class="synergy-metric">
              <span>Focus Usage:</span> <span>${cardAnalysis.synergies.focusAttacks.focusUsage}</span>
            </div>
            <div class="synergy-metric">
              <span>Attack Cards:</span> <span>${cardAnalysis.synergies.focusAttacks.potentialSynergy}</span>
            </div>
            <div class="synergy-metric">
              <span>Synergy Ratio:</span> <span>${(cardAnalysis.synergies.focusAttacks.synergyRatio * 100).toFixed(1)}%</span>
            </div>
            <p class="recommendation">${cardAnalysis.synergies.focusAttacks.recommendation}</p>
          </div>
          
          <div class="synergy-card">
            <h4>🔄 Echo Multiplier Analysis</h4>
            <div class="synergy-metric">
              <span>Echo Usage:</span> <span>${cardAnalysis.synergies.echoMultipliers.echoUsage}</span>
            </div>
            <div class="synergy-metric">
              <span>Echo Rate:</span> <span>${(cardAnalysis.synergies.echoMultipliers.echoRate * 100).toFixed(1)}%</span>
            </div>
            <div class="synergy-metric">
              <span>Potential Value:</span> <span>${cardAnalysis.synergies.echoMultipliers.potentialValue.toFixed(1)}</span>
            </div>
            <p class="recommendation">${cardAnalysis.synergies.echoMultipliers.recommendation}</p>
          </div>
          
          <div class="synergy-card">
            <h4>⚡ Energy Ramp Strategy</h4>
            <div class="synergy-metric">
              <span>Ramp Cards:</span> <span>${cardAnalysis.synergies.energyRamps.rampCards}</span>
            </div>
            <div class="synergy-metric">
              <span>Energy Growth:</span> <span>+${cardAnalysis.synergies.energyRamps.energyGrowth.toFixed(1)}</span>
            </div>
            <div class="synergy-metric">
              <span>Ramp Efficiency:</span> <span>${cardAnalysis.synergies.energyRamps.rampEfficiency.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="underutilized-combos">
          <h4>🎯 Underutilized Combinations</h4>
          ${cardAnalysis.underutilizedCombos.map(combo => `
            <div class="combo-card">
              <strong>${combo.cards.join(' + ')}</strong>
              <p>${combo.description}</p>
              <div class="combo-stats">
                <span class="potential">${combo.potential} Potential</span>
                <span class="utilization">${combo.currentUtilization} Utilization</span>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="strategy-recommendations">
          <h4>🚀 Strategic Recommendations</h4>
          ${cardAnalysis.strategicRecommendations.map(rec => 
            `<div class="recommendation-item">💡 ${rec}</div>`
          ).join('')}
        </div>
      </div>
    `;
  }

  renderOpportunities() {
    const opportunities = analyzeStrategicOpportunities();
    
    return `
      <div class="opportunities-analysis">
        <h3>🚀 Strategic Opportunities</h3>
        
        <div class="opportunities-grid">
          ${opportunities.map(opp => `
            <div class="opportunity-card ${opp.impact}">
              <div class="opportunity-header">
                <h4>${opp.area}</h4>
                <span class="impact-badge ${opp.impact}">${opp.impact} impact</span>
              </div>
              <div class="opportunity-type">${opp.type}</div>
              <p class="opportunity-insight">${opp.insight}</p>
              ${opp.actionable ? '<div class="actionable-badge">✅ Actionable</div>' : ''}
            </div>
          `).join('')}
        </div>
        
        ${opportunities.length === 0 ? `
          <div class="no-opportunities">
            <h4>🎉 Excellent Play!</h4>
            <p>You're already playing very efficiently. Keep up the great work!</p>
          </div>
        ` : ''}
      </div>
    `;
  }

  renderDesignInsights() {
    const analysis = analyzeGameStates();
    const insights = analysis.designInsights;
    
    return `
      <div class="design-insights">
        <h3>🎨 Design Insights & Card Representation</h3>
        
        <div class="insights-grid">
          ${insights.map(insight => `
            <div class="insight-card">
              <h4>${insight.category}</h4>
              <div class="insight-content">
                <p class="insight-text">${insight.insight}</p>
                <div class="evidence">
                  <strong>Evidence:</strong> ${insight.evidence}
                </div>
                <div class="recommendation">
                  <strong>Recommendation:</strong> ${insight.recommendation}
                </div>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="game-state-analysis">
          <h4>🎲 Game State Transitions</h4>
          <div class="state-transition-card">
            <h5>Game Phases</h5>
            <div class="phase-list">
              ${Object.entries(analysis.gameStateTransitions.gamePhases).map(([phase, description]) => 
                `<div class="phase-item"><strong>${phase}:</strong> ${description}</div>`
              ).join('')}
            </div>
          </div>
          
          <div class="comeback-analysis">
            <h5>🔄 Comeback Mechanics</h5>
            <p><strong>Comeback Potential:</strong> ${analysis.gameStateTransitions.comebackMechanics.comebackPotential}</p>
            <p><strong>Defense/Offense Balance:</strong> ${analysis.gameStateTransitions.comebackMechanics.defenseToOffenseRatio.toFixed(2)}</p>
            <p><strong>Healing Importance:</strong> ${analysis.gameStateTransitions.comebackMechanics.healingImportance.toFixed(2)}</p>
          </div>
          
          <div class="win-conditions">
            <h5>🏆 Win Condition Analysis</h5>
            <div class="win-stats">
              <div class="win-stat">
                <span>Aggressive Wins:</span> 
                <span>${analysis.gameStateTransitions.winConditionPaths.aggroWins}</span>
              </div>
              <div class="win-stat">
                <span>Control Wins:</span> 
                <span>${analysis.gameStateTransitions.winConditionPaths.controlWins}</span>
              </div>
              <div class="win-stat">
                <span>Dominant Strategy:</span> 
                <span>${analysis.gameStateTransitions.winConditionPaths.dominantStrategy}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Show the analysis panel
  show() {
    let panel = document.getElementById('analysis-panel');
    if (!panel) {
      panel = this.createAnalysisPanel();
      document.body.appendChild(panel);
    }
    
    panel.style.display = 'block';
    this.updateContent();
  }

  // Hide the analysis panel
  hide() {
    const panel = document.getElementById('analysis-panel');
    if (panel) {
      panel.style.display = 'none';
    }
  }
}

// CSS styles for the analysis UI
export const analysisCSS = `
.analysis-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90vw;
  max-width: 1200px;
  height: 80vh;
  background: linear-gradient(135deg, #2a1a4a, #1a1a2e);
  border: 2px solid #ffd700;
  border-radius: 12px;
  padding: 20px;
  z-index: 1000;
  overflow: hidden;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.7);
  color: #ffffff;
  font-family: 'Orbitron', monospace;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  border-bottom: 1px solid #ffd700;
  padding-bottom: 15px;
}

.analysis-header h2 {
  margin: 0;
  color: #ffd700;
  font-size: 24px;
}

.analysis-tabs {
  display: flex;
  gap: 10px;
}

.tab-btn {
  background: transparent;
  border: 1px solid #ffd700;
  color: #ffd700;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-family: inherit;
}

.tab-btn:hover {
  background: rgba(255, 215, 0, 0.1);
}

.tab-btn.active {
  background: #ffd700;
  color: #1a1a2e;
}

.close-btn {
  background: transparent;
  border: none;
  color: #ffd700;
  font-size: 24px;
  cursor: pointer;
  padding: 0 10px;
}

.analysis-content {
  height: calc(100% - 80px);
  overflow-y: auto;
  padding-right: 10px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 30px;
}

.metric-card {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
}

.metric-card h3 {
  margin: 0 0 10px 0;
  color: #ffd700;
  font-size: 16px;
}

.metric-value {
  font-size: 32px;
  font-weight: bold;
  color: #ffffff;
  margin: 10px 0;
}

.metric-card p {
  margin: 0;
  color: #cccccc;
  font-size: 14px;
}

.insights-summary, .opportunities-preview {
  margin: 30px 0;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.insights-summary h3, .opportunities-preview h3 {
  color: #ffd700;
  margin-bottom: 15px;
}

.insight-item, .recommendation-item {
  background: rgba(255, 215, 0, 0.1);
  padding: 12px;
  margin: 8px 0;
  border-radius: 6px;
  border-left: 3px solid #ffd700;
}

.opportunity-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  border-left: 4px solid;
}

.opportunity-card.high {
  border-left-color: #ff4444;
}

.opportunity-card.medium {
  border-left-color: #ffaa00;
}

.opportunity-card.low {
  border-left-color: #44ff44;
}

.impact-badge {
  background: rgba(255, 215, 0, 0.2);
  color: #ffd700;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  float: right;
}

.synergy-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.synergy-card {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 20px;
}

.synergy-card h4 {
  color: #ffd700;
  margin-bottom: 15px;
}

.synergy-metric {
  display: flex;
  justify-content: space-between;
  margin: 8px 0;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255, 215, 0, 0.2);
}

.recommendation {
  margin-top: 15px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  font-style: italic;
}

.combo-card {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin: 10px 0;
  border: 1px solid rgba(255, 215, 0, 0.3);
}

.combo-stats {
  display: flex;
  gap: 15px;
  margin-top: 10px;
}

.potential, .utilization {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.potential {
  background: rgba(68, 255, 68, 0.2);
  color: #44ff44;
}

.utilization {
  background: rgba(255, 68, 68, 0.2);
  color: #ff4444;
}

.insights-grid, .opportunities-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}

.insight-card {
  background: rgba(255, 215, 0, 0.1);
  border: 1px solid #ffd700;
  border-radius: 8px;
  padding: 20px;
}

.insight-card h4 {
  color: #ffd700;
  margin-bottom: 15px;
}

.evidence, .recommendation {
  margin: 10px 0;
  padding: 10px;
  border-radius: 6px;
}

.evidence {
  background: rgba(0, 100, 255, 0.1);
  border-left: 3px solid #0064ff;
}

.recommendation {
  background: rgba(68, 255, 68, 0.1);
  border-left: 3px solid #44ff44;
}

.no-opportunities {
  text-align: center;
  padding: 40px;
  background: rgba(68, 255, 68, 0.1);
  border-radius: 8px;
  border: 1px solid #44ff44;
}

/* Scrollbar styling */
.analysis-content::-webkit-scrollbar {
  width: 8px;
}

.analysis-content::-webkit-scrollbar-track {
  background: rgba(255, 215, 0, 0.1);
  border-radius: 4px;
}

.analysis-content::-webkit-scrollbar-thumb {
  background: #ffd700;
  border-radius: 4px;
}

.analysis-content::-webkit-scrollbar-thumb:hover {
  background: #ffed4e;
}
`;

// Export for manual initialization
export function initializeAnalysisUI() {
  // Add CSS to document
  const style = document.createElement('style');
  style.textContent = analysisCSS;
  document.head.appendChild(style);
  
  // Create global instance
  window.analysisUI = new AnalysisUI();
  
  // Add keyboard shortcut to open analysis (Ctrl+A)
  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'a' && !e.target.closest('input, textarea')) {
      e.preventDefault();
      window.analysisUI.show();
    }
  });
}