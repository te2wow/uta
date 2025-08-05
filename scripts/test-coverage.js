#!/usr/bin/env node

/**
 * Test Coverage Analysis Script
 * 
 * This script analyzes Jest coverage reports and provides detailed insights
 * about test coverage, including 100% coverage verification.
 */

const fs = require('fs');
const path = require('path');

const COVERAGE_DIR = path.join(__dirname, '..', 'coverage');
const COVERAGE_SUMMARY_FILE = path.join(COVERAGE_DIR, 'coverage-summary.json');
const LCOV_INFO_FILE = path.join(COVERAGE_DIR, 'lcov.info');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function formatPercentage(pct) {
  if (pct === 100) return colorize(`${pct}%`, 'green');
  if (pct >= 90) return colorize(`${pct}%`, 'yellow');
  return colorize(`${pct}%`, 'red');
}

function getStatusIcon(pct) {
  if (pct === 100) return '✅';
  if (pct >= 90) return '🟡';
  return '❌';
}

function analyzeCoverageSummary() {
  console.log(colorize('\n📊 COVERAGE ANALYSIS REPORT', 'bright'));
  console.log('='.repeat(50));

  if (!fs.existsSync(COVERAGE_SUMMARY_FILE)) {
    console.error(colorize('❌ Coverage summary file not found!', 'red'));
    console.error(`Expected: ${COVERAGE_SUMMARY_FILE}`);
    process.exit(1);
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
  const { total } = coverageData;

  // Overall coverage table
  console.log(colorize('\n📈 Overall Coverage:', 'bright'));
  console.log('┌─────────────┬──────────┬────────────┬───────────┬────────┐');
  console.log('│ Metric      │ Coverage │ Covered    │ Total     │ Status │');
  console.log('├─────────────┼──────────┼────────────┼───────────┼────────┤');

  const metrics = ['statements', 'branches', 'functions', 'lines'];
  const results = {};

  metrics.forEach(metric => {
    const data = total[metric];
    const pct = data.pct;
    const covered = data.covered;
    const total_count = data.total;
    const status = getStatusIcon(pct);
    
    results[metric] = { pct, covered, total: total_count, status };
    
    console.log(`│ ${metric.padEnd(11)} │ ${formatPercentage(pct).padEnd(18)} │ ${covered.toString().padStart(10)} │ ${total_count.toString().padStart(9)} │ ${status.padEnd(6)} │`);
  });

  console.log('└─────────────┴──────────┴────────────┴───────────┴────────┘');

  // Check 100% coverage requirement
  const perfect100 = metrics.every(metric => results[metric].pct === 100);
  
  if (perfect100) {
    console.log(colorize('\n🎉 PERFECT 100% COVERAGE ACHIEVED!', 'green'));
    console.log(colorize('🏆 All metrics at 100% - Excellent work!', 'green'));
  } else {
    console.log(colorize('\n⚠️  100% COVERAGE NOT ACHIEVED', 'yellow'));
    console.log('Missing coverage in:');
    metrics.forEach(metric => {
      if (results[metric].pct < 100) {
        const missing = results[metric].total - results[metric].covered;
        console.log(`  • ${metric}: ${missing} uncovered out of ${results[metric].total}`);
      }
    });
  }

  return { perfect100, results };
}

function analyzeFilesCoverage() {
  if (!fs.existsSync(COVERAGE_SUMMARY_FILE)) {
    return;
  }

  const coverageData = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
  
  console.log(colorize('\n📁 File-by-File Coverage:', 'bright'));
  
  const files = Object.keys(coverageData).filter(key => key !== 'total');
  
  if (files.length === 0) {
    console.log('No individual file coverage data available.');
    return;
  }

  const imperfectFiles = [];
  
  files.forEach(filePath => {
    const fileData = coverageData[filePath];
    const fileName = path.basename(filePath);
    
    const allPerfect = ['statements', 'branches', 'functions', 'lines']
      .every(metric => fileData[metric].pct === 100);
    
    if (!allPerfect) {
      imperfectFiles.push({
        path: filePath,
        name: fileName,
        data: fileData
      });
    }
  });

  if (imperfectFiles.length === 0) {
    console.log(colorize('✅ All files have 100% coverage!', 'green'));
  } else {
    console.log(colorize(`❌ ${imperfectFiles.length} files need improvement:`, 'red'));
    
    imperfectFiles.forEach(file => {
      console.log(`\n📄 ${file.name}:`);
      ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
        const pct = file.data[metric].pct;
        if (pct < 100) {
          const covered = file.data[metric].covered;
          const total = file.data[metric].total;
          const missing = total - covered;
          console.log(`  • ${metric}: ${formatPercentage(pct)} (${missing} uncovered)`);
        }
      });
    });
  }
}

function generateCoverageReport() {
  console.log(colorize('\n📋 Generating detailed coverage report...', 'blue'));
  
  const reportData = {
    timestamp: new Date().toISOString(),
    summary: {},
    recommendations: []
  };

  if (fs.existsSync(COVERAGE_SUMMARY_FILE)) {
    const coverageData = JSON.parse(fs.readFileSync(COVERAGE_SUMMARY_FILE, 'utf8'));
    reportData.summary = coverageData.total;
    
    // Generate recommendations
    if (reportData.summary.statements.pct < 100) {
      reportData.recommendations.push('Add tests to cover uncovered statements');
    }
    if (reportData.summary.branches.pct < 100) {
      reportData.recommendations.push('Add tests for uncovered conditional branches (if/else, switch cases)');
    }
    if (reportData.summary.functions.pct < 100) {
      reportData.recommendations.push('Add tests to call all functions and methods');
    }
    if (reportData.summary.lines.pct < 100) {
      reportData.recommendations.push('Add tests to execute all code lines');
    }
  }

  const reportFile = path.join(COVERAGE_DIR, 'coverage-analysis.json');
  fs.writeFileSync(reportFile, JSON.stringify(reportData, null, 2));
  
  console.log(`📊 Report saved to: ${reportFile}`);
}

function displayTestingTips() {
  console.log(colorize('\n💡 Tips for 100% Coverage:', 'cyan'));
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 1. Test all code paths (if/else, switch statements)    │');
  console.log('│ 2. Test error conditions and edge cases               │');
  console.log('│ 3. Test all public methods and functions              │');
  console.log('│ 4. Mock external dependencies properly                │');
  console.log('│ 5. Test async/Promise code with proper awaits         │');
  console.log('│ 6. Use describe/it blocks for organized test structure │');
  console.log('│ 7. Check coverage after each test addition            │');
  console.log('└─────────────────────────────────────────────────────────┘');
}

function main() {
  console.log(colorize('🧪 VRM Mirror Studio Test Coverage Analyzer', 'magenta'));
  
  try {
    const { perfect100 } = analyzeCoverageSummary();
    analyzeFilesCoverage();
    generateCoverageReport();
    
    if (!perfect100) {
      displayTestingTips();
    }
    
    console.log(colorize('\n🎯 Coverage Goal: 100% on all metrics', 'bright'));
    console.log(colorize('📁 Detailed HTML report: coverage/html-report/index.html', 'blue'));
    
    // Exit with appropriate code
    process.exit(perfect100 ? 0 : 1);
    
  } catch (error) {
    console.error(colorize('❌ Error analyzing coverage:', 'red'));
    console.error(error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeCoverageSummary,
  analyzeFilesCoverage,
  generateCoverageReport
};