import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrackType } from '../types';
import {
  Code2,
  Database,
  Shield,
  Briefcase,
  Users,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Target,
  ArrowRight,
  BookOpen,
  Sparkles,
  Layout,
  Layers,
  Cpu,
  Cloud,
  CheckSquare,
} from 'lucide-react';

interface TipCategory {
  title: string;
  icon: React.FC<{ className?: string }>;
  items: string[];
}

interface TrackPrepData {
  track: TrackType;
  label: string;
  icon: React.FC<{ className?: string }>;
  accentColor: string;
  badgeBg: string;
  framework: string;
  idealPacing: string;
  mindset: string;
  categories: {
    coreTechnical: TipCategory;
    communication: TipCategory;
    pitfalls: TipCategory;
    confidence: TipCategory;
  };
  checklist: string[];
}

const PREP_DATA: Record<TrackType, TrackPrepData> = {
  SDE: {
    track: 'SDE',
    label: 'Software Engineer (SDE)',
    icon: Code2,
    accentColor: 'text-indigo-600 dark:text-indigo-400',
    badgeBg: 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-500/30',
    framework: 'Understand → Brute Force → Optimize → Code → Test Edge Cases',
    idealPacing: '2-3 min clarifying problem, 15 min coding, 5 min testing',
    mindset: 'Think out loud continuously. Interviewers care as much about your problem-solving reasoning as the final code.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Refresh time & space complexity analysis (Big-O notation).',
          'Review core data structures: Hash Maps, Trees, Graphs, Two-Pointer technique, and Dynamic Programming.',
          'For System Design: practice breaking down systems into Load Balancers, Caching (Redis), DB Partitioning, and Message Queues.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Always state the brute force solution first to set a baseline before jumping into optimizations.',
          'Narrate your code while typing or writing; explain why you chose specific data structures.',
          'Explicitly walk through dry runs with small example inputs and boundary edge cases (null, empty, negative numbers).',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Jumping straight into coding without clarifying constraints and input bounds.',
          'Staying silent for longer than 15-20 seconds without sharing your thoughts.',
          'Ignoring space complexity tradeoffs when optimizing for time complexity.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Remember: It is completely normal to ask clarifying questions or ask for a moment to think.',
          'If you get stuck, explain your current hypothesis and ask if your direction sounds reasonable.',
          'Keep your tone collaborative — treat the interviewer as a teammate pairing on a tricky bug.',
        ],
      },
    },
    checklist: [
      'Reviewed Big-O cheat sheet for arrays, heaps, and tree traversals',
      'Prepared 2 questions regarding system scale and API constraints',
      'Tested voice input or microphone clarity',
    ],
  },
  'Data Scientist': {
    track: 'Data Scientist',
    label: 'Data Scientist & AI',
    icon: Database,
    accentColor: 'text-purple-600 dark:text-purple-400',
    badgeBg: 'bg-purple-50 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/30',
    framework: 'Business Problem → Data Exploration → Model Selection → Metrics & Evaluation',
    idealPacing: '3 min metrics definition, 10 min pipeline design, 5 min model tradeoff discussion',
    mindset: 'Bridge raw statistical mechanics with actionable business outcome metrics.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Be ready to explain precision vs. recall, ROC-AUC, F1-score, and AB testing statistical power.',
          'Brush up on SQL window functions (e.g. ROW_NUMBER, LAG/LEAD) and data manipulation techniques.',
          'Understand model evaluation trade-offs: bias vs. variance, overfitting mitigation, and feature importance.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Always tie model choice back to the business constraint (latency vs. accuracy vs. interpretability).',
          'Use clear step-by-step phases: Problem formulation → Feature engineering → Validation strategy.',
          'Be prepared to justify why a simpler model (e.g. Logistic Regression) might beat a complex NN in production.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Focusing purely on algorithmic theory while ignoring data quality, leakage, and missing values.',
          'Recommending deep learning models when baseline linear models or tree ensembles suffice.',
          'Forgetting to mention online deployment monitoring and model drift detection.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Highlight real business value: "By optimizing recall, we prevent $X in customer churn."',
          'Acknowledge data limitations upfront — interviewers appreciate practical engineering maturity.',
        ],
      },
    },
    checklist: [
      'Refreshed metrics: Precision/Recall, AUC-ROC, MSE vs MAE',
      'Reviewed SQL window functions and aggregation queries',
      'Prepared 1-minute overview of a recent ML project',
    ],
  },
  Cybersecurity: {
    track: 'Cybersecurity',
    label: 'Cybersecurity & Infosec',
    icon: Shield,
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/30',
    framework: 'CIA Triad (Confidentiality, Integrity, Availability) & Defense-in-Depth',
    idealPacing: '2 min threat modeling, 10 min mitigation strategy, 5 min incident response log',
    mindset: 'Think like an attacker, design like a defender, document like an auditor.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Master OWASP Top 10 vulnerabilities (XSS, SQLi, CSRF, SSRF, Broken Access Control).',
          'Understand public-key cryptography, TLS 1.3 handshakes, and identity management protocols (OAuth2, SAML, JWT).',
          'Review Incident Response lifecycles (Preparation, Identification, Containment, Eradication, Recovery).',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Use threat modeling frameworks like STRIDE or MITRE ATT&CK to categorize vectors.',
          'Structure responses with threat vector → blast radius assessment → layered control mitigation.',
          'Balance security controls against user experience and business operations friction.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Proposing single points of defense instead of defense-in-depth architecture.',
          'Neglecting human factors like social engineering, phishing, and credential management.',
          'Forgetting logging, observability, and SIEM alerting integration.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Emphasize risk prioritization: classify vulnerabilities by impact and likelihood.',
          'Show security enablement mindset: security as an accelerator, not just a bottleneck.',
        ],
      },
    },
    checklist: [
      'Reviewed OWASP Top 10 and recent high-profile CVE mitigation patterns',
      'Refreshed OAuth2 vs SAML protocol flows',
      'Prepared Incident Containment playbook steps',
    ],
  },
  'Product Manager': {
    track: 'Product Manager',
    label: 'Product Manager (PM)',
    icon: Briefcase,
    accentColor: 'text-amber-600 dark:text-amber-400',
    badgeBg: 'bg-amber-50 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/30',
    framework: 'CIRCLES Method: Comprehend → Identify → Report → Cut → List → Evaluate → Summarize',
    idealPacing: '3 min user personas & pain points, 8 min solution brain-storm, 4 min prioritization & metrics',
    mindset: 'Focus obsessively on user pain points before proposing feature solutions.',
    categories: {
      coreTechnical: {
        title: 'Core PM Focus',
        icon: Target,
        items: [
          'Be ready to define Success Metrics (North Star Metric, DAU/MAU, Retention cohorts, LTV/CAC).',
          'Use prioritization frameworks (RICE, MoSCoW, Impact vs. Effort matrix).',
          'Practice product breakdown exercises for both software products and physical hardware.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Explicitly state assumptions and ask the interviewer to validate them before proceeding.',
          'Segment users into distinct personas and select 1-2 primary targets to solve for.',
          'Conclude with clear trade-off analysis and risk mitigation plans for your top solution.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Proposing solutions immediately without defining the user segment or core problem.',
          'Suggesting laundry lists of features without prioritizing the MVP.',
          'Failing to specify measurable success metrics or launch guardrails.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Show strong structured thinking — write down your high-level outline before diving in.',
          'Express genuine user empathy and passion for great product design.',
        ],
      },
    },
    checklist: [
      'Prepared 2 examples of North Star metrics for popular apps',
      'Refreshed CIRCLES and RICE prioritization frameworks',
      'Outlined a recent product trade-off decision from your past experience',
    ],
  },
  'HR/Behavioral': {
    track: 'HR/Behavioral',
    label: 'HR & Behavioral Leadership',
    icon: Users,
    accentColor: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-50 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/30',
    framework: 'STAR Method: Situation (15%) → Task (15%) → Action (50%) → Result (20%)',
    idealPacing: '15 sec situation, 15 sec task, 60 sec action steps, 30 sec quantified results & learning',
    mindset: 'Anchor every story in concrete personal actions, measurable outcomes, and key learnings.',
    categories: {
      coreTechnical: {
        title: 'Core Behavioral Focus',
        icon: Target,
        items: [
          'Prepare 4-5 versatile stories covering: Conflict resolution, Failure & learning, Leadership under pressure, and Technical disagreement.',
          'Always quantify results: percentages, revenue saved, time reduced, team morale improved.',
          'Highlight team collaboration and individual accountability side by side.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Spend the majority of time (50%+) on YOUR specific actions, decisions, and reasoning.',
          'Use "I" instead of "we" when detailing specific contributions.',
          'End every answer with what you learned and how it shaped your approach going forward.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Spending 2 minutes setting up the backstory/situation and running out of time for actions.',
          'Giving vague, hypothetical answers ("I usually try to communicate...") instead of concrete past stories.',
          'Blaming others when discussing past conflicts or failed projects.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Speak with authentic reflection — acknowledging mistakes shows executive maturity.',
          'Maintain steady pacing; pause briefly before answering to structure your STAR outline.',
        ],
      },
    },
    checklist: [
      'Drafted 4 versatile STAR stories with quantified metric results',
      'Practiced a 60-second "Tell me about yourself" elevator pitch',
      'Identified key learnings from a past project failure or obstacle',
    ],
  },
  'Frontend Engineer': {
    track: 'Frontend Engineer',
    label: 'Frontend Engineering & UI Architecture',
    icon: Layout,
    accentColor: 'text-sky-600 dark:text-sky-400',
    badgeBg: 'bg-sky-50 dark:bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-500/30',
    framework: 'Requirements → Architecture & State → Component Boundaries → Optimization & Security',
    idealPacing: '2 min UI requirements, 5 min component tree & state layout, 15 min coding, 3 min performance review',
    mindset: 'Focus on user experience, browser rendering performance (Core Web Vitals), and clean state architecture.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Review Core Web Vitals (LCP, CLS, INP) and DOM rendering pipeline optimizations.',
          'Master React 18 Concurrent features, Server Components, and custom hooks architecture.',
          'Understand client-side security: Content Security Policy (CSP), XSS mitigation, and CORS policies.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Explain component state placement choices (local state vs context vs global store).',
          'Discuss responsive design patterns and accessibility (ARIA, semantic HTML) proactively.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Neglecting re-render performance and missing key memoization techniques.',
          'Over-complicating state management for simple component hierarchies.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Diagram component trees mentally before coding to show structural vision.',
          'Connect technical UI choices directly to user impact and business conversion metrics.',
        ],
      },
    },
    checklist: [
      'Reviewed Core Web Vitals optimization techniques',
      'Practiced explaining React state normalization patterns',
      'Checked browser audio and speech recognition settings',
    ],
  },
  'Full Stack Engineer': {
    track: 'Full Stack Engineer',
    label: 'Full Stack Web Engineering',
    icon: Layers,
    accentColor: 'text-blue-600 dark:text-blue-400',
    badgeBg: 'bg-blue-50 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/30',
    framework: 'Client Requirements → API Contracts → Database Schema → End-to-End Security',
    idealPacing: '3 min API design & DB schema, 12 min backend logic, 10 min frontend integration',
    mindset: 'Demonstrate holistic understanding of both browser client interaction and robust server architecture.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Review REST vs GraphQL API design guidelines and HTTP status codes.',
          'Practice relational vs document database schema modeling and indexing.',
          'Understand JWT authentication flow, token storage, and session security.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Outline full data flow from client trigger to server database write and back.',
          'Explain trade-offs between server-side rendering and client-side single page applications.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Focusing exclusively on one side (frontend or backend) and skipping full integration integrity.',
          'Hardcoding secrets or skipping error handling middleware.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Highlight experience with end-to-end feature ownership from spec to production deployment.',
        ],
      },
    },
    checklist: [
      'Reviewed JWT and OAuth security flow diagrams',
      'Prepared examples of database query optimizations',
      'Verified mic voice recording clarity',
    ],
  },
  'Data Engineer': {
    track: 'Data Engineer',
    label: 'Data Engineering & Big Data',
    icon: Cpu,
    accentColor: 'text-teal-600 dark:text-teal-400',
    badgeBg: 'bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-500/30',
    framework: 'Source Data → Ingestion & Stream → Transformation & Storage → Serving Layer',
    idealPacing: '3 min throughput & schema setup, 15 min pipeline design, 5 min failure recovery',
    mindset: 'Focus on pipeline reliability, data quality guarantees, streaming throughput, and storage cost.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Review batch (Spark) vs streaming (Kafka/Flink) pipeline processing architectures.',
          'Practice SQL window functions, partitioning, and indexing strategies for massive tables.',
          'Understand data lakehouse formats: Delta Lake, Apache Iceberg, Parquet compression.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Walk through data schema transformations step by step.',
          'Explicitly address out-of-order data, duplicate messages, and late-arriving records.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Ignoring data skew in distributed joins.',
          'Forgetting data retention policies and storage partitioning strategies.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Emphasize idempotency in automated ETL job pipelines.',
        ],
      },
    },
    checklist: [
      'Reviewed Spark partitioning and shuffle mechanics',
      'Practiced complex SQL window function syntax',
      'Set target question count and difficulty level',
    ],
  },
  'DevOps & Cloud': {
    track: 'DevOps & Cloud',
    label: 'DevOps & Cloud Architecture',
    icon: Cloud,
    accentColor: 'text-cyan-600 dark:text-cyan-400',
    badgeBg: 'bg-cyan-50 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30',
    framework: 'Infrastructure Spec → Containerization → Orchestration → CI/CD & Observability',
    idealPacing: '3 min SLA/SLO definition, 15 min Cloud architecture, 5 min deployment & monitoring strategy',
    mindset: 'Prioritize automation, immutable infrastructure, zero-downtime deployment, and system resilience.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Master Kubernetes primitives: Pods, Services, Ingress, HPA, and StatefulSets.',
          'Review Infrastructure as Code (Terraform) state management and modular patterns.',
          'Practice CI/CD pipeline security, Docker multi-stage builds, and secret management.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Explain Blue/Green and Canary deployment strategies clearly.',
          'Detail alert escalation policies, metrics (Prometheus/Grafana), and log aggregation.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Over-engineering cluster topologies for simple single-region workloads.',
          'Neglecting disaster recovery backup and multi-region failover plans.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Demonstrate calm, methodical incident troubleshooting mindset.',
        ],
      },
    },
    checklist: [
      'Reviewed Kubernetes networking and CNI concepts',
      'Prepared disaster recovery scenario summary',
      'Tested microphone for live speech practice',
    ],
  },
  'QA & Automation': {
    track: 'QA & Automation',
    label: 'QA & Test Automation Strategy',
    icon: CheckSquare,
    accentColor: 'text-violet-600 dark:text-violet-400',
    badgeBg: 'bg-violet-50 dark:bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-200 dark:border-violet-500/30',
    framework: 'Test Strategy → Automation Framework → Test Suite Coverage → CI Integration & Reporting',
    idealPacing: '3 min risk analysis, 12 min framework architecture, 5 min test data management',
    mindset: 'Think like a quality defender: anticipate edge cases, prevent regression bugs, and speed up CI loops.',
    categories: {
      coreTechnical: {
        title: 'Core Technical Focus',
        icon: Target,
        items: [
          'Review Playwright / Cypress Page Object Model (POM) automation architecture.',
          'Practice API contract testing, mock services, and database seed strategies.',
          'Understand load testing strategies (k6, JMeter) and performance degradation limits.',
        ],
      },
      communication: {
        title: 'Structuring Your Explanation',
        icon: Lightbulb,
        items: [
          'Structure test cases using Given-When-Then (BDD) style clarity.',
          'Explain how you triage flaky tests in CI pipelines without disabling coverage.',
        ],
      },
      pitfalls: {
        title: 'Pitfalls to Avoid',
        icon: AlertTriangle,
        items: [
          'Relying solely on UI end-to-end tests when unit or integration tests are faster.',
          'Hardcoding test environment credentials or static test data.',
        ],
      },
      confidence: {
        title: 'Confidence Boosters',
        icon: Zap,
        items: [
          'Highlight test execution velocity improvements achieved in past projects.',
        ],
      },
    },
    checklist: [
      'Reviewed Page Object Model design principles',
      'Prepared API contract testing explanation',
      'Confirmed target track configuration',
    ],
  },
};

export const PreparationTips: React.FC = () => {
  const navigate = useNavigate();
  const [activeTrack, setActiveTrack] = useState<TrackType>('SDE');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Local state for interactive checklist
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('interview_prep_checklist');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const toggleChecklist = (itemKey: string) => {
    setCheckedItems((prev) => {
      const updated = { ...prev, [itemKey]: !prev[itemKey] };
      try {
        localStorage.setItem('interview_prep_checklist', JSON.stringify(updated));
      } catch {
        // Fallback
      }
      return updated;
    });
  };

  const currentPrep = PREP_DATA[activeTrack];
  const IconComponent = currentPrep.icon;

  return (
    <div className="bg-[rgba(42,27,51,0.72)] backdrop-blur-xl border border-[rgba(248,244,233,0.08)] rounded-3xl p-6 sm:p-8 space-y-6 shadow-[0_10px_30px_-10px_rgba(15,7,20,0.5)] relative overflow-hidden transition-all text-[#F8F4E9]">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-[rgba(248,244,233,0.08)]">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] text-xs font-bold border border-[rgba(246,219,192,0.3)] mb-2">
            <BookOpen className="w-3.5 h-3.5 text-[#F6DBC0]" />
            Interview Preparation Guide
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8F4E9] tracking-tight">
            Track-Specific Strategy & Warmup Tips
          </h2>
          <p className="text-xs text-[rgba(248,244,233,0.65)] font-medium mt-1">
            Boost your confidence before jumping into a mock session with expert frameworks and checklists.
          </p>
        </div>

        {/* Quick Practice Button for Selected Track */}
        <button
          onClick={() => navigate(`/track-selection?track=${encodeURIComponent(currentPrep.track)}`)}
          className="px-5 py-2.5 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] active:scale-95 text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] font-extrabold text-xs rounded-xl shadow-[0_0_16px_rgba(147,80,115,0.35)] transition-all flex items-center gap-2 shrink-0 cursor-pointer"
        >
          <span>Practice {currentPrep.track} Mock</span>
          <ArrowRight className="w-3.5 h-3.5 text-[#F6DBC0]" />
        </button>
      </div>

      {/* Track Selection Dropdown */}
      <div className="bg-[rgba(26,15,34,0.6)] p-3.5 rounded-2xl border border-[rgba(248,244,233,0.08)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label htmlFor="track-select-dropdown" className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider flex items-center gap-1.5 shrink-0">
            <Target className="w-4 h-4 text-[#F6DBC0]" />
            Select Role Track:
          </label>
          
          <select
            id="track-select-dropdown"
            value={activeTrack}
            onChange={(e) => setActiveTrack(e.target.value as TrackType)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#1A0F22] border border-[rgba(248,244,233,0.12)] text-xs font-bold text-[#F8F4E9] shadow-xs focus:outline-none focus:border-[#935073] cursor-pointer"
          >
            {(Object.keys(PREP_DATA) as TrackType[]).map((trackKey) => {
              const t = PREP_DATA[trackKey];
              return (
                <option key={trackKey} value={trackKey} className="bg-[#1A0F22] text-[#F8F4E9]">
                  {t.label} ({t.track})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Active Track Highlight Banner */}
      <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-[rgba(80,45,85,0.6)] border border-[rgba(246,219,192,0.3)] text-[#F6DBC0] flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(147,80,115,0.3)]">
              <IconComponent className="w-6 h-6 text-[#F6DBC0]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-[#F8F4E9]">
                  {currentPrep.label}
                </h3>
                <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold bg-[rgba(147,80,115,0.3)] text-[#F6DBC0] border border-[rgba(246,219,192,0.3)]">
                  {currentPrep.track}
                </span>
              </div>
              <p className="text-xs text-[rgba(248,244,233,0.7)] font-medium mt-0.5">
                {currentPrep.mindset}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Framework & Pacing Pill Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs border-t border-[rgba(248,244,233,0.08)]">
          <div className="bg-[rgba(42,27,51,0.7)] p-3.5 rounded-xl border border-[rgba(248,244,233,0.08)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6DBC0] flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F6DBC0]" /> Recommended Answer Framework:
            </span>
            <p className="font-bold text-[#F8F4E9]">{currentPrep.framework}</p>
          </div>

          <div className="bg-[rgba(42,27,51,0.7)] p-3.5 rounded-xl border border-[rgba(248,244,233,0.08)] space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#F6DBC0] flex items-center gap-1">
              <Target className="w-3 h-3 text-[#935073]" /> Ideal Answer Pacing & Time Allocation:
            </span>
            <p className="font-bold text-[#F8F4E9]">{currentPrep.idealPacing}</p>
          </div>
        </div>
      </div>

      {/* Category Dropdown & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <label htmlFor="category-select" className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-[#F6DBC0]" />
          Filter Strategy Category:
        </label>
        
        {/* Dropdown for quick selection */}
        <select
          id="category-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl bg-[#1A0F22] border border-[rgba(248,244,233,0.12)] text-xs font-bold text-[#F8F4E9] focus:outline-none focus:border-[#935073] cursor-pointer"
        >
          <option value="all" className="bg-[#1A0F22] text-[#F8F4E9]">All Categories (Sequential View)</option>
          <option value="coreTechnical" className="bg-[#1A0F22] text-[#F8F4E9]">1. Core Technical Focus</option>
          <option value="communication" className="bg-[#1A0F22] text-[#F8F4E9]">2. Structuring Your Explanation</option>
          <option value="pitfalls" className="bg-[#1A0F22] text-[#F8F4E9]">3. Pitfalls to Avoid</option>
          <option value="confidence" className="bg-[#1A0F22] text-[#F8F4E9]">4. Confidence Boosters</option>
          <option value="actionableExercise" className="bg-[#1A0F22] text-[#F8F4E9]">5. 5-Minute Actionable Practice Exercise</option>
        </select>
      </div>

      {/* Structured Advice Cards - Sequential Stack (One after another) */}
      <div className="space-y-4">
        {/* 1. Core Technical Focus */}
        {(selectedCategory === 'all' || selectedCategory === 'coreTechnical') && (
          <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#F8F4E9]">
              <Target className="w-4 h-4 text-[#F6DBC0]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider">
                {currentPrep.categories.coreTechnical.title}
              </h4>
            </div>
            <ul className="space-y-2">
              {currentPrep.categories.coreTechnical.items.map((item, idx) => (
                <li key={idx} className="text-xs text-[rgba(248,244,233,0.8)] font-medium flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#935073] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 2. Communication & Structuring Strategy */}
        {(selectedCategory === 'all' || selectedCategory === 'communication') && (
          <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#F8F4E9]">
              <Lightbulb className="w-4 h-4 text-[#F6DBC0]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider">
                {currentPrep.categories.communication.title}
              </h4>
            </div>
            <ul className="space-y-2">
              {currentPrep.categories.communication.items.map((item, idx) => (
                <li key={idx} className="text-xs text-[rgba(248,244,233,0.8)] font-medium flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#F6DBC0] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 3. Common Pitfalls to Avoid */}
        {(selectedCategory === 'all' || selectedCategory === 'pitfalls') && (
          <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#F8F4E9]">
              <AlertTriangle className="w-4 h-4 text-[#E57373]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#E57373]">
                {currentPrep.categories.pitfalls.title}
              </h4>
            </div>
            <ul className="space-y-2">
              {currentPrep.categories.pitfalls.items.map((item, idx) => (
                <li key={idx} className="text-xs text-[rgba(248,244,233,0.8)] font-medium flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E57373] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 4. Confidence & Poise Boosters */}
        {(selectedCategory === 'all' || selectedCategory === 'confidence') && (
          <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-[#F8F4E9]">
              <Zap className="w-4 h-4 text-[#7FE3B9]" />
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#7FE3B9]">
                {currentPrep.categories.confidence.title}
              </h4>
            </div>
            <ul className="space-y-2">
              {currentPrep.categories.confidence.items.map((item, idx) => (
                <li key={idx} className="text-xs text-[rgba(248,244,233,0.8)] font-medium flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7FE3B9] mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 5. 5-Minute Actionable Practice Exercise */}
        {(selectedCategory === 'all' || selectedCategory === 'actionableExercise') && (
          <div className="bg-gradient-to-r from-[rgba(80,45,85,0.4)] to-[rgba(147,80,115,0.25)] border border-[rgba(246,219,192,0.3)] rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[rgba(248,244,233,0.08)] pb-3">
              <div className="flex items-center gap-2 text-[#F8F4E9]">
                <Sparkles className="w-4 h-4 text-[#F6DBC0]" />
                <h4 className="text-xs font-black uppercase tracking-wider text-[#F6DBC0]">
                  5-Minute Actionable Practice Exercise ({currentPrep.track})
                </h4>
              </div>
              <span className="text-[11px] font-mono font-bold text-[#7FE3B9] px-2.5 py-0.5 rounded-full bg-[rgba(127,227,185,0.12)] border border-[rgba(127,227,185,0.3)] w-fit">
                ⏱️ 5-Minute Drill
              </span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-[#F8F4E9] block">
                Practice Prompt:
              </span>
              <p className="text-xs text-[#F6DBC0] italic bg-[rgba(26,15,34,0.6)] p-3 rounded-xl border border-[rgba(248,244,233,0.08)] font-medium leading-relaxed">
                "{currentPrep.track === 'SDE'
                  ? 'How would you design a thread-safe distributed in-memory cache with an LRU eviction policy?'
                  : currentPrep.track === 'Frontend Engineer'
                  ? 'Explain React Fiber reconciliation and how you troubleshoot unnecessary component re-renders.'
                  : currentPrep.track === 'Full Stack Engineer'
                  ? 'Trace an authenticated POST /api/checkout request from browser click to database commit.'
                  : currentPrep.track === 'Data Scientist'
                  ? 'Explain to an executive why 98% accuracy can be misleading in an imbalanced fraud detection model.'
                  : currentPrep.track === 'Data Engineer'
                  ? 'Architect a fault-tolerant batch ETL pipeline processing 50M records with schema evolution.'
                  : currentPrep.track === 'DevOps & Cloud'
                  ? 'A critical microservice is throwing 502 errors and CrashLoopBackOff across pods. Walk through your triage.'
                  : currentPrep.track === 'Cybersecurity'
                  ? 'Identify top attack vectors and remediation for GET /api/users/:id/invoices (BOLA / IDOR).'
                  : currentPrep.track === 'Product Manager'
                  ? 'Design a high-impact onboarding experience for an AI productivity app and state your North Star metric.'
                  : currentPrep.track === 'QA & Automation'
                  ? 'Formulate a test pyramid and flaky-test elimination strategy for a critical checkout flow.'
                  : 'Deliver a 90-second STAR response for: Tell me about a time you adapted quickly to a major shift in priority.'}"
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[rgba(248,244,233,0.7)] block">
                Step-by-Step Action Plan (5 Minutes):
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                  <strong className="text-[#F6DBC0] block mb-0.5">Minute 1: Clarify & Scope</strong>
                  <span className="text-[rgba(248,244,233,0.75)]">Confirm requirements, input constraints, and declare your framework upfront.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                  <strong className="text-[#F6DBC0] block mb-0.5">Minutes 2-3: Speak Your Solution Out Loud</strong>
                  <span className="text-[rgba(248,244,233,0.75)]">Narrate your reasoning, data structures, and trade-offs continuously without long pauses.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                  <strong className="text-[#F6DBC0] block mb-0.5">Minute 4: Address Edge Cases</strong>
                  <span className="text-[rgba(248,244,233,0.75)]">Cover concurrency, failure modes, scale limitations, and mitigation tactics.</span>
                </div>
                <div className="p-2.5 rounded-xl bg-[rgba(26,15,34,0.5)] border border-[rgba(248,244,233,0.06)]">
                  <strong className="text-[#7FE3B9] block mb-0.5">Minute 5: Launch Mock Practice</strong>
                  <span className="text-[rgba(248,244,233,0.75)]">Take the prompt into the live AI voice room to get scored on speech cadence and technical depth.</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => navigate(`/track-selection?track=${encodeURIComponent(currentPrep.track)}`)}
                className="px-4 py-2 bg-gradient-to-r from-[#502D55] via-[#935073] to-[#a65d83] hover:from-[#603766] hover:to-[#ba6d95] text-[#F8F4E9] border border-[rgba(246,219,192,0.3)] font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <span>Practice {currentPrep.track} Mock</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#F6DBC0]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Quick Warmup Checklist - Stacked Line by Line */}
      <div className="bg-[rgba(26,15,34,0.6)] border border-[rgba(248,244,233,0.08)] rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <h4 className="text-xs font-extrabold text-[#F8F4E9] uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#7FE3B9]" />
            Pre-Interview Confidence Checklist ({currentPrep.track})
          </h4>
          <span className="text-[11px] font-bold text-[rgba(248,244,233,0.6)]">
            {currentPrep.checklist.filter((item) => checkedItems[`${activeTrack}_${item}`]).length} / {currentPrep.checklist.length} Completed
          </span>
        </div>

        <div className="space-y-2.5">
          {currentPrep.checklist.map((checkItem, idx) => {
            const itemKey = `${activeTrack}_${checkItem}`;
            const isChecked = !!checkedItems[itemKey];

            return (
              <label
                key={idx}
                onClick={() => toggleChecklist(itemKey)}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition text-xs font-medium select-none ${
                  isChecked
                    ? 'bg-[rgba(127,227,185,0.12)] border-[rgba(127,227,185,0.3)] text-[#7FE3B9] line-through'
                    : 'bg-[rgba(42,27,51,0.8)] border-[rgba(248,244,233,0.08)] text-[#F8F4E9] hover:border-[rgba(147,80,115,0.4)]'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}} // handled by parent label onClick
                  className="w-4 h-4 rounded text-[#935073] focus:ring-[#935073] cursor-pointer shrink-0 accent-[#935073]"
                />
                <span className="leading-snug">{checkItem}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};
