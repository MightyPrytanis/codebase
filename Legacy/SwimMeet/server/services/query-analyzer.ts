export interface QueryAnalysis {
  complexity: 'simple' | 'moderate' | 'complex' | 'expert';
  type: 'analytical' | 'creative' | 'technical' | 'strategic' | 'research';
  scope: 'focused' | 'multi-faceted' | 'interdisciplinary';
  timeframe: 'immediate' | 'planning' | 'long-term';
  collaboration_need: 'low' | 'medium' | 'high' | 'critical';
}

export type WorkflowStrategy = 
  | 'sequential'           // Current implementation - step by step
  | 'parallel_merge'       // All AIs work simultaneously, merge results
  | 'specialist_teams'     // Group AIs by expertise, sequential teams
  | 'iterative_refinement' // Multiple rounds of improvement
  | 'competitive_selection'; // Multiple approaches, select best

export class QueryAnalyzer {
  private readonly complexityKeywords = {
    simple: ['what', 'when', 'who', 'where', 'define', 'explain briefly'],
    moderate: ['how', 'why', 'compare', 'analyze', 'evaluate'],
    complex: ['design', 'develop', 'create', 'build', 'implement', 'strategy'],
    expert: ['optimize', 'architect', 'research', 'investigate', 'comprehensive analysis']
  };

  private readonly typeKeywords = {
    analytical: ['analyze', 'compare', 'evaluate', 'assess', 'examine', 'data', 'statistics'],
    creative: ['design', 'create', 'generate', 'brainstorm', 'innovative', 'creative', 'ideas'],
    technical: ['code', 'implement', 'build', 'develop', 'technical', 'programming', 'system'],
    strategic: ['plan', 'strategy', 'roadmap', 'approach', 'framework', 'methodology'],
    research: ['research', 'investigate', 'study', 'explore', 'find', 'discover', 'sources']
  };

  private readonly scopeKeywords = {
    focused: ['specific', 'particular', 'single', 'one', 'exact'],
    'multi-faceted': ['multiple', 'various', 'several', 'different', 'aspects'],
    interdisciplinary: ['across', 'between', 'combine', 'integrate', 'multidisciplinary']
  };

  private readonly timeframeKeywords = {
    immediate: ['now', 'today', 'immediately', 'urgent', 'asap', 'quick'],
    planning: ['plan', 'future', 'upcoming', 'schedule', 'timeline'],
    'long-term': ['long-term', 'strategic', 'roadmap', 'vision', 'years']
  };

  analyzeQuery(query: string, attachments?: any[]): QueryAnalysis {
    const lowerQuery = query.toLowerCase();
    const wordCount = query.split(' ').length;
    
    const complexity = this.determineComplexity(lowerQuery, wordCount, attachments);
    const type = this.categorizeQueryType(lowerQuery);
    const scope = this.analyzeScope(lowerQuery);
    const timeframe = this.detectTimeframe(lowerQuery);
    const collaboration_need = this.assessCollaborationNeed(complexity, type, scope);
    
    return { complexity, type, scope, timeframe, collaboration_need };
  }

  private determineComplexity(query: string, wordCount: number, attachments?: any[]): QueryAnalysis['complexity'] {
    // Check for complexity keywords
    for (const [level, keywords] of Object.entries(this.complexityKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        if (level === 'expert' || (level === 'complex' && wordCount > 50)) return 'expert';
        if (level === 'complex' || (level === 'moderate' && wordCount > 30)) return 'complex';
        if (level === 'moderate' || wordCount > 15) return 'moderate';
        return level as QueryAnalysis['complexity'];
      }
    }

    // Fallback based on length and attachments
    if (attachments && attachments.length > 0) return 'complex';
    if (wordCount > 50) return 'expert';
    if (wordCount > 30) return 'complex';
    if (wordCount > 15) return 'moderate';
    return 'simple';
  }

  private categorizeQueryType(query: string): QueryAnalysis['type'] {
    let maxScore = 0;
    let detectedType: QueryAnalysis['type'] = 'analytical';

    for (const [type, keywords] of Object.entries(this.typeKeywords)) {
      const score = keywords.reduce((acc, keyword) => 
        acc + (query.includes(keyword) ? 1 : 0), 0);
      
      if (score > maxScore) {
        maxScore = score;
        detectedType = type as QueryAnalysis['type'];
      }
    }

    return detectedType;
  }

  private analyzeScope(query: string): QueryAnalysis['scope'] {
    for (const [scope, keywords] of Object.entries(this.scopeKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return scope as QueryAnalysis['scope'];
      }
    }

    // Fallback: analyze structure
    const sentences = query.split(/[.!?]+/).length;
    const hasMultipleQuestions = (query.match(/\?/g) || []).length > 1;
    
    if (sentences > 3 || hasMultipleQuestions) return 'multi-faceted';
    if (query.includes(' and ') || query.includes(' or ')) return 'multi-faceted';
    return 'focused';
  }

  private detectTimeframe(query: string): QueryAnalysis['timeframe'] {
    for (const [timeframe, keywords] of Object.entries(this.timeframeKeywords)) {
      if (keywords.some(keyword => query.includes(keyword))) {
        return timeframe as QueryAnalysis['timeframe'];
      }
    }
    return 'immediate';
  }

  private assessCollaborationNeed(
    complexity: QueryAnalysis['complexity'],
    type: QueryAnalysis['type'], 
    scope: QueryAnalysis['scope']
  ): QueryAnalysis['collaboration_need'] {
    let score = 0;

    // Complexity contributes to collaboration need
    switch (complexity) {
      case 'simple': score += 1; break;
      case 'moderate': score += 2; break;
      case 'complex': score += 3; break;
      case 'expert': score += 4; break;
    }

    // Type affects collaboration need
    if (type === 'strategic' || type === 'research') score += 2;
    if (type === 'creative') score += 1;

    // Scope affects collaboration need
    if (scope === 'interdisciplinary') score += 3;
    if (scope === 'multi-faceted') score += 2;

    if (score <= 2) return 'low';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'high';
    return 'critical';
  }

  selectWorkflowStrategy(analysis: QueryAnalysis, availableAIs: string[]): WorkflowStrategy {
    const { complexity, collaboration_need, scope, type } = analysis;

    // Expert complexity with critical collaboration need
    if (complexity === 'expert' && collaboration_need === 'critical') {
      if (availableAIs.length >= 4) {
        return scope === 'interdisciplinary' ? 'specialist_teams' : 'iterative_refinement';
      }
      return 'sequential';
    }

    // Complex problems with high collaboration need
    if (complexity === 'complex' && collaboration_need === 'high') {
      if (availableAIs.length >= 3) {
        return type === 'creative' ? 'competitive_selection' : 'parallel_merge';
      }
      return 'sequential';
    }

    // Creative or strategic queries benefit from competition
    if ((type === 'creative' || type === 'strategic') && availableAIs.length >= 3) {
      return 'competitive_selection';
    }

    // Research queries benefit from parallel work
    if (type === 'research' && availableAIs.length >= 2) {
      return 'parallel_merge';
    }

    // Multi-faceted scope with multiple AIs
    if (scope === 'multi-faceted' && availableAIs.length >= 3) {
      return 'specialist_teams';
    }

    // Default fallback
    return 'sequential';
  }

  generateWorkflowPlan(analysis: QueryAnalysis, strategy: WorkflowStrategy, availableAIs: string[]) {
    switch (strategy) {
      case 'sequential':
        return this.generateSequentialPlan(analysis, availableAIs);
      
      case 'parallel_merge':
        return this.generateParallelMergePlan(analysis, availableAIs);
      
      case 'specialist_teams':
        return this.generateSpecialistTeamsPlan(analysis, availableAIs);
      
      case 'iterative_refinement':
        return this.generateIterativeRefinementPlan(analysis, availableAIs);
      
      case 'competitive_selection':
        return this.generateCompetitiveSelectionPlan(analysis, availableAIs);
      
      default:
        return this.generateSequentialPlan(analysis, availableAIs);
    }
  }

  private generateSequentialPlan(analysis: QueryAnalysis, availableAIs: string[]) {
    const steps = availableAIs.map((ai, index) => ({
      step: index + 1,
      assignedAI: ai,
      objective: `Build upon previous work and contribute specialized expertise`,
      prompt: `Continue the collaborative analysis. Previous context will be provided.`,
      completed: false,
      output: ''
    }));

    return {
      strategy: 'sequential' as const,
      totalSteps: steps.length,
      steps
    };
  }

  private generateParallelMergePlan(analysis: QueryAnalysis, availableAIs: string[]) {
    const parallelSteps = availableAIs.map((ai, index) => ({
      step: index + 1,
      assignedAI: ai,
      objective: `Analyze independently from ${ai}'s perspective`,
      prompt: `Provide your unique analysis and recommendations on this query.`,
      completed: false,
      output: ''
    }));

    const mergeStep = {
      step: availableAIs.length + 1,
      assignedAI: availableAIs[0], // Use first AI for synthesis
      objective: 'Synthesize all parallel analyses into unified response',
      prompt: 'Review all parallel analyses and create comprehensive synthesis.',
      completed: false,
      output: ''
    };

    return {
      strategy: 'parallel_merge' as const,
      totalSteps: parallelSteps.length + 1,
      steps: [...parallelSteps, mergeStep]
    };
  }

  private generateSpecialistTeamsPlan(analysis: QueryAnalysis, availableAIs: string[]) {
    // Group AIs into specialist teams based on query type
    const teams = this.createSpecialistTeams(analysis.type, availableAIs);
    const steps = teams.flatMap((team, teamIndex) => 
      team.map((ai, aiIndex) => ({
        step: teamIndex * team.length + aiIndex + 1,
        assignedAI: ai,
        objective: `Team ${teamIndex + 1} specialist contribution`,
        prompt: `As part of the ${this.getTeamRole(teamIndex, analysis.type)} team, provide specialized analysis.`,
        completed: false,
        output: ''
      }))
    );

    return {
      strategy: 'specialist_teams' as const,
      totalSteps: steps.length,
      steps
    };
  }

  private generateIterativeRefinementPlan(analysis: QueryAnalysis, availableAIs: string[]) {
    const rounds = Math.min(3, Math.ceil(availableAIs.length / 2));
    const steps: any[] = [];
    let stepCounter = 1;

    for (let round = 1; round <= rounds; round++) {
      availableAIs.forEach(ai => {
        steps.push({
          step: stepCounter++,
          assignedAI: ai,
          objective: `Refinement Round ${round}`,
          prompt: round === 1 
            ? 'Provide initial analysis and solution approach.'
            : `Refine and improve based on previous round feedback.`,
          completed: false,
          output: ''
        });
      });
    }

    return {
      strategy: 'iterative_refinement' as const,
      totalSteps: steps.length,
      steps
    };
  }

  private generateCompetitiveSelectionPlan(analysis: QueryAnalysis, availableAIs: string[]) {
    const competitiveSteps = availableAIs.map((ai, index) => ({
      step: index + 1,
      assignedAI: ai,
      objective: `Compete with independent solution approach`,
      prompt: `Provide your best independent solution. This will be evaluated against other approaches.`,
      completed: false,
      output: ''
    }));

    const evaluationStep = {
      step: availableAIs.length + 1,
      assignedAI: availableAIs[0], // Use first AI for evaluation
      objective: 'Evaluate competitive solutions and select/combine best elements',
      prompt: 'Evaluate all competitive solutions and create optimal synthesis.',
      completed: false,
      output: ''
    };

    return {
      strategy: 'competitive_selection' as const,
      totalSteps: competitiveSteps.length + 1,
      steps: [...competitiveSteps, evaluationStep]
    };
  }

  private createSpecialistTeams(queryType: QueryAnalysis['type'], availableAIs: string[]) {
    // Simple team creation - can be enhanced based on AI capabilities
    const teamSize = Math.max(2, Math.floor(availableAIs.length / 2));
    const teams: string[][] = [];
    
    for (let i = 0; i < availableAIs.length; i += teamSize) {
      teams.push(availableAIs.slice(i, i + teamSize));
    }
    
    return teams;
  }

  private getTeamRole(teamIndex: number, queryType: QueryAnalysis['type']) {
    const roles = {
      analytical: ['Analysis', 'Validation'],
      creative: ['Ideation', 'Refinement'],
      technical: ['Architecture', 'Implementation'],
      strategic: ['Planning', 'Execution'],
      research: ['Investigation', 'Synthesis']
    };
    
    const teamRoles = roles[queryType] || ['Primary', 'Secondary'];
    return teamRoles[teamIndex % teamRoles.length];
  }
}