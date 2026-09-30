const fs = require('fs');
let text = fs.readFileSync('src/lib/services/policy.ts', 'utf8');

if (!text.includes('PolicyConditionEvaluator')) {
  text = "import { PolicyConditionEvaluator } from './policy-evaluator';\n" + text;
}

const targetStart = text.indexOf('if (selectedPolicy.autoApproveCondition && context?.request) {');
const targetEnd = text.indexOf('let explanation = Policy selected:', targetStart);

const before = text.slice(0, targetStart);
const after = text.slice(targetEnd);

const newLogic = \if (selectedPolicy.autoApproveCondition) {
      try {
        const condition = JSON.parse(selectedPolicy.autoApproveCondition);
        const metadataObj = context?.request?.metadata ? JSON.parse(context.request.metadata) : {};
        
        // Build evaluation context securely
        const evalContext = {
           requestType: payload.requestType,
           category: payload.category,
           domain: payload.domain,
           ...metadataObj // Merge safely for things like leaveDays
        };

        const isApproved = PolicyConditionEvaluator.evaluate(condition, evalContext);

        if (isApproved) {
           autoApproveAllowed = true;
           autoApproveExplanation = 'Auto-approved because policy conditions were successfully met.';
        } else {
           autoApproveExplanation = 'Not auto-approved because policy conditions were not met.';
        }
      } catch (e) {
         console.error('Failed to parse or evaluate autoApproveCondition', e);
         autoApproveExplanation = 'Auto-approval bypassed due to condition evaluation error.';
      }
    }

    \;

fs.writeFileSync('src/lib/services/policy.ts', before + newLogic + after);
