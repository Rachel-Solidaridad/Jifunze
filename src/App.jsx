import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BookOpen, Award, CheckCircle2, ChevronRight, ChevronLeft, Home, Users, Target, Lightbulb, Shield, ShieldAlert, Globe, Mail, Palette, FileText, AlertTriangle, Sparkles, Trophy, X, Check, ArrowRight, RotateCcw, MapPin, TrendingUp, Leaf, Search, BarChart3, MessageSquare, BookMarked, Clock, Layers, Menu, DollarSign, CloudRain, Database, ClipboardCheck, Coffee, Apple, Wheat, Pickaxe, Shirt, Milk, Scissors, TreePalm, Bean, Lock } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, query, orderBy, limit, onSnapshot, addDoc, writeBatch, increment } from 'firebase/firestore';
import { auth, googleProvider, ALLOWED_DOMAIN, db } from './firebase';
import { ROLES, isSeedAdmin, normalizeRole, canViewAdminDashboard, isAdmin } from './auth/roles';
import { listAssignmentsForUser } from './admin/queries';
// Branded Solidaridad commodity glyphs, used for the commodity courses.
import soyIcon from './assets/commodities/soy.svg';
import coffeeIcon from './assets/commodities/coffee.svg';
import teaIcon from './assets/commodities/tea.svg';
import oilPalmIcon from './assets/commodities/oil-palm.svg';
import foodCropsIcon from './assets/commodities/food-crops.svg';
import fruitsVegIcon from './assets/commodities/fruits-veg.svg';
import cocoaIcon from './assets/commodities/cocoa.svg';
import goldIcon from './assets/commodities/gold.svg';
import cottonIcon from './assets/commodities/cotton-textile.svg';
import leatherIcon from './assets/commodities/leather.svg';
import dairyIcon from './assets/commodities/dairy.svg';
// Branded Solidaridad glyphs for the non-commodity courses.
import welcomeIcon from './assets/icons/welcome.png';
import maspIcon from './assets/icons/masp.svg';
import integrityIcon from './assets/icons/integrity.svg';
import ethicsIcon from './assets/icons/ethics.svg';
import climateIcon from './assets/icons/climate.svg';
import financeIcon from './assets/icons/finance.png';
import truePricingIcon from './assets/icons/truepricing.png';
import brandIconSrc from './assets/icons/brand.svg';
import digitalIcon from './assets/icons/digital.svg';
import pmelIcon from './assets/icons/pmel.svg';
import genderIcon from './assets/icons/gender.svg';
import eudrIcon from './assets/icons/eudr.png';
import riskIcon from './assets/icons/risk.svg';
import financePolicyIcon from './assets/icons/finance-policy.svg';

// Lazy-loaded so the admin bundle isn't part of the initial download for
// learners (the large majority of users).
const AdminDashboard = lazy(() => import('./admin/AdminDashboard'));

const YELLOW = '#FFC800';
const GREY = '#D9D9C3';
const BLACK = '#000000';

// Wraps a branded commodity SVG so it can be used wherever a course `icon`
// component is expected (same { size, className } API as the lucide icons).
// Rendered as a black silhouette to match the icon treatment on the yellow
// course panels.
const commodityIcon = (src) => function CommodityIcon({ size = 24, className = '', style }) {
  return (
    <img
      src={src}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className={className}
      style={{ filter: 'brightness(0)', objectFit: 'contain', display: 'block', ...style }}
    />
  );
};

const Swoosh = ({ w = 180, color = YELLOW }) => (
  <svg width={w} height="10" viewBox="0 0 180 10" className="mt-1">
    <path d="M2 7 Q 90 1, 178 5" stroke={color} strokeWidth="4" fill="none" strokeLinecap="round" />
  </svg>
);

const JifunzeIcon = ({ size = 32, color = '#fff', accent = YELLOW }) => (
  <svg width={size} height={size} viewBox="0 0 36 36" fill="none">
    <path d="M4 8 Q 4 6, 6 6 L 16 6 Q 18 6, 18 8 L 18 30 L 6 30 Q 4 30, 4 28 Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
    <path d="M32 8 Q 32 6, 30 6 L 20 6 Q 18 6, 18 8 L 18 30 L 30 30 Q 32 30, 32 28 Z" stroke={color} strokeWidth="2.5" strokeLinejoin="round" fill="none" />
    <path d="M8 12 L 14 12 M 8 16 L 14 16 M 8 20 L 14 20" stroke={accent} strokeWidth="2" strokeLinecap="round" />
    <path d="M22 12 L 28 12 M 22 16 L 28 16 M 22 20 L 28 20" stroke={accent} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const SidebarLogo = () => (
  <div className="flex items-center gap-2.5">
    <JifunzeIcon size={36} color="#fff" accent={YELLOW} />
    <div className="flex flex-col items-start">
      <span className="font-extrabold text-2xl text-white tracking-tight leading-none">Jifunze</span>
      <Swoosh w={80} />
    </div>
  </div>
);

const Logo = ({ light = false }) => (
  <div className="inline-flex items-center gap-2.5">
    <JifunzeIcon size={36} color={light ? '#fff' : BLACK} accent={YELLOW} />
    <div className="flex flex-col items-start">
      <span className={`font-extrabold text-2xl tracking-tight leading-none ${light ? 'text-white' : 'text-black'}`}>
        Jifunze
      </span>
      <Swoosh w={80} />
    </div>
  </div>
);

// Decorative leaf motif (reused from the dashboard hero) for the loading screen.
const LeafMotif = ({ className = '', color = YELLOW, style }) => (
  <svg viewBox="0 0 200 200" className={className} style={style} fill="none" stroke={color} strokeWidth="3">
    <path d="M100 30 Q 160 60, 160 130 Q 160 170, 100 170 Q 40 170, 40 130 Q 40 60, 100 30 Z" strokeLinejoin="round" />
    <path d="M100 30 L 100 170" strokeLinecap="round" />
    <path d="M100 70 Q 130 80, 145 110" strokeLinecap="round" />
    <path d="M100 90 Q 130 100, 145 130" strokeLinecap="round" />
    <path d="M100 110 Q 130 120, 140 145" strokeLinecap="round" />
    <path d="M100 70 Q 70 80, 55 110" strokeLinecap="round" />
    <path d="M100 90 Q 70 100, 55 130" strokeLinecap="round" />
    <path d="M100 110 Q 70 120, 60 145" strokeLinecap="round" />
  </svg>
);

// Branded full-screen loader. A dark canvas (so the white logo reads), floating
// leaf vectors, and a row of "growing" blades that animate while data loads.
const LoadingScreen = () => (
  <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-black text-white">
    <style>{`
      @keyframes jf-float { 0%,100%{ transform: translateY(0); } 50%{ transform: translateY(-14px); } }
      @keyframes jf-grow { 0%,100%{ transform: scaleY(0.35); opacity: 0.45; } 50%{ transform: scaleY(1); opacity: 1; } }
      @keyframes jf-rise { 0%{ opacity: 0; transform: translateY(10px); } 100%{ opacity: 1; transform: translateY(0); } }
    `}</style>

    {/* Floating background leaf vectors */}
    <LeafMotif className="absolute -left-16 -top-10 w-72 h-72 opacity-[0.07]" style={{ animation: 'jf-float 7s ease-in-out infinite' }} />
    <LeafMotif className="absolute right-[-3rem] top-1/4 w-56 h-56 opacity-[0.06]" style={{ animation: 'jf-float 9s ease-in-out infinite', animationDelay: '1.2s' }} />
    <LeafMotif className="absolute -bottom-16 left-1/4 w-80 h-80 opacity-[0.05]" style={{ animation: 'jf-float 8s ease-in-out infinite', animationDelay: '0.6s' }} />
    {/* Warm glow behind the mark */}
    <div className="absolute w-[28rem] h-[28rem] rounded-full blur-3xl opacity-20" style={{ background: `radial-gradient(circle, ${YELLOW} 0%, transparent 70%)` }} />

    <div className="relative z-10 flex flex-col items-center px-6 text-center" style={{ animation: 'jf-rise 0.7s ease-out both' }}>
      <JifunzeIcon size={76} color="#fff" accent={YELLOW} />
      <span className="mt-4 font-extrabold text-4xl text-white tracking-tight leading-none">Jifunze</span>
      <Swoosh w={130} />
      <p className="mt-3 text-sm uppercase tracking-[0.25em] text-gray-400">Solidaridad ECA Learning Hub</p>

      {/* Growing blades loader */}
      <div className="mt-9 flex items-end gap-1.5 h-9">
        {[0, 1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className="w-2 rounded-full"
            style={{
              height: '100%',
              backgroundColor: YELLOW,
              transformOrigin: 'bottom',
              animation: `jf-grow 1.1s ease-in-out ${i * 0.13}s infinite`,
            }}
          />
        ))}
      </div>

      <p className="mt-6 text-sm text-gray-400">Loading your learning hub…</p>
      <p className="mt-10 text-xs uppercase tracking-[0.3em] text-gray-600">Change that matters</p>
    </div>
  </div>
);

const COURSES = [
  {
    id: 'welcome',
    title: 'HR Culture & Compliance',
    subtitle: 'Onboarding essentials',
    category: 'HR',
    icon: commodityIcon(welcomeIcon),
    duration: '45 min',
    description: 'Welcome to Solidaridad East and Central Africa! A complete onboarding course covering who we are, our values, history, governance, HR essentials, integrity, and your first 90 days.',
    lessons: [
      {
        id: 'who-we-are',
        title: 'Who We Are',
        content: [
          { type: 'p', text: 'Solidaridad is an international civil society organization with over 55 years of experience in developing solutions to make communities more resilient and create more sustainable supply chains.' },
          { type: 'p', text: 'Our nearly 1,500 staff work in more than 40 countries with deep knowledge of local contexts. We work throughout the entire value chain to make sustainability the norm.' },
          { type: 'h', text: 'Solidaridad East & Central Africa' },
          { type: 'p', text: 'Headquartered in Nairobi, Kenya, ECA has country offices in Ethiopia, Kenya, Tanzania, and Uganda, plus outreach in Burundi, Cameroon, DRC, and Rwanda. The region is led by Managing Director Rachel Wanyoike.' },
          { type: 'callout', text: 'The word "Solidaridad" is the Spanish word for solidarity — chosen in the early days when our work focused on supporting liberation movements in Latin America.' },
          { type: 'p', text: 'In ECA, we work across three sectors: agriculture (coffee, tea, cocoa, livestock, fruits & vegetables, oil palm, food crops, spices, medicinal herbs), industry (fashion: cotton, leather, textiles), and mining (gold).' },
        ],
      },
      {
        id: 'vision-mission',
        title: 'Vision, Mission & Pay-off',
        content: [
          { type: 'h', text: 'Our Vision' },
          { type: 'p', text: 'An economy that works for all: a world in which all we produce, and all we consume, can sustain us while respecting the planet, each other and the next generations.' },
          { type: 'h', text: 'Our Mission' },
          { type: 'p', text: 'To enable farmers and workers to earn a living income, shape their own future, and produce in balance with nature, by working throughout the whole supply chain to make sustainability the norm.' },
          { type: 'highlight', text: 'We do all we can for small-scale farmers to make supply chains more sustainable.' },
          { type: 'h', text: 'Our Pay-off' },
          { type: 'p', text: 'CHANGE THAT MATTERS — used when it supports the content, and never translated. It expresses what we deliver: lasting, meaningful transformation for farmers, workers, and ecosystems.' },
        ],
      },
      {
        id: 'history',
        title: 'Our History',
        content: [
          { type: 'p', text: 'Solidaridad started in 1969 as a Dutch ecumenical development organization working in Latin America. Over 55+ years we have evolved across four major phases:' },
          { type: 'pathway', title: 'PHASE 1: 1970s-80s', text: 'Movement support and consumer power. Built awareness that consumers can transform sectors toward sustainability.' },
          { type: 'pathway', title: 'PHASE 2: LATE 1980s-90s', text: 'Fair Trade labelling. Sparked the Max Havelaar fair-trade coffee label, then bananas, then cocoa and other commodities.' },
          { type: 'pathway', title: 'PHASE 3: 2000s-2010s', text: 'Sector-wide collaboration. Co-founded multi-stakeholder Round Tables for soy, palm oil, sugarcane, cotton — bringing producers, buyers, and civil society together.' },
          { type: 'pathway', title: 'PHASE 4: 2020s', text: 'Producer-led systems change. Focused on governments to regulate the market, companies to change business policies, and producers to lead transformation.' },
          { type: 'callout', text: 'Solidaridad has been active in East Africa for over 15 years — long enough to build deep trust with cooperatives, governments, and producers.' },
        ],
      },
      {
        id: 'values',
        title: 'Our Four Core Values',
        content: [
          { type: 'p', text: 'Solidaridad\'s values are rooted in our DNA of solidarity with under-resourced communities and our drive to develop market-based solutions that have real positive impact.' },
          { type: 'value', title: 'SOLIDARITY', text: 'We hold ourselves in deep solidarity with disadvantaged groups and are mindful of the effects of our behaviour on others. Solidarity shapes how we listen, how we share power, and who is in the room when decisions are made.' },
          { type: 'value', title: 'IMPACT-DRIVEN', text: 'We are fully committed to our mission and focused on achieving tangible improvements for small-scale farmers. We measure what we change — not just what we do — and we are not afraid of honest results.' },
          { type: 'value', title: 'SOLUTION-ORIENTED', text: 'We are pragmatic, innovative problem solvers — always searching for solutions that deliver the most positive change. We co-create with the people closest to the problem, then test, refine, and scale.' },
          { type: 'value', title: 'INTEGRITY', text: 'We adhere to the highest ethical principles and professional standards. We value trust, transparency and accountability — both within Solidaridad and with the farmers, workers, and partners we serve.' },
        ],
      },
      {
        id: 'governance',
        title: 'How We Are Governed',
        content: [
          { type: 'p', text: 'Solidaridad is a network organization. This means we are locally managed and globally connected — a structural choice that distinguishes us from most international NGOs.' },
          { type: 'h', text: 'Structure' },
          { type: 'list', items: [
            'Each region has its own Managing Director and operations',
            'Each region has a Continental Supervisory Board (CSB) for governance',
            'The International Supervisory Board (ISB) oversees the network globally',
            'The Executive Board of Directors (EBoD), chaired by the Executive Director of Solidaridad Network, manages day-to-day strategy',
            'The Network Secretariat supports global coordination from Utrecht, Netherlands',
          ]},
          { type: 'h', text: 'In ECA' },
          { type: 'p', text: 'Solidaridad East & Central Africa is headquartered in Nairobi, with country offices in Addis Ababa, Kampala, and Arusha. Each country has its own Country Manager and team, reporting to the Regional Managing Director.' },
          { type: 'highlight', text: 'Local expertise. Global reach. Boots and brains on the ground.' },
        ],
      },
      {
        id: 'who-we-work-for',
        title: 'Who We Work For',
        content: [
          { type: 'p', text: 'Under MASP IV (2026-2030), Solidaridad East & Central Africa will reach over 1.1 million stakeholders. The people at the heart of our work are:' },
          { type: 'stat', number: '811,250', label: 'Small-scale farmers', detail: '55% men · 30% women · 15% youth' },
          { type: 'stat', number: '273,200', label: 'Workers', detail: 'In farms, plantations, and agro-processing' },
          { type: 'stat', number: '30,000', label: 'Artisanal & Small-scale Miners', detail: 'Particularly in gold' },
          { type: 'stat', number: '303', label: 'MSMEs supported', detail: '50% youth- and/or women-led' },
          { type: 'stat', number: '250+', label: 'Civil Society Organizations', detail: 'Cooperatives, unions, producer groups' },
          { type: 'callout', text: 'These are the people whose lives our work changes. Every decision we make should be defensible to them.' },
        ],
      },
      {
        id: 'your-onboarding',
        title: 'Your First 90 Days',
        content: [
          { type: 'p', text: 'Joining Solidaridad is an investment — for you and for us. Your first three months should set you up to deliver and grow:' },
          { type: 'pathway', title: 'WEEK 1', text: 'Meet your team. Read the MASP IV strategy. Complete required onboarding modules (HR, integrity, brand). Set up your tools: Gmail, Google Workspace, Plaza (Salesforce), Uwanjani.' },
          { type: 'pathway', title: 'WEEKS 2-4', text: 'Shadow colleagues on field visits. Sit in on at least one cooperative meeting. Meet with your line manager to agree your individual objectives.' },
          { type: 'pathway', title: 'MONTH 2', text: 'Take ownership of your first deliverable. Build relationships across countries — join one community of practice. Begin contributing in your area of expertise.' },
          { type: 'pathway', title: 'MONTH 3', text: 'Probation review with your manager. Set 6-month development goals. Identify one stretch contribution beyond your job description.' },
          { type: 'highlight', text: 'Ask questions. Lots of them. Especially in your first 90 days.' },
        ],
      },
      {
        id: 'hr-essentials',
        title: 'HR Essentials',
        content: [
          { type: 'h', text: 'Your contract' },
          { type: 'p', text: 'Country offices issue contracts under local labour law. Read yours carefully — pay attention to probation period, notice periods, leave entitlements, and benefits like medical cover and pension.' },
          { type: 'h', text: 'Leave' },
          { type: 'list', items: [
            'Annual leave: per your country\'s policy (typically 21-25 working days)',
            'Sick leave: notify your line manager as soon as possible, follow your country\'s policy on medical certificates',
            'Compassionate / bereavement leave: per local policy',
            'Maternity and paternity leave: per local labour law',
            'All leave is requested and approved in the HR system',
          ]},
          { type: 'h', text: 'Performance management' },
          { type: 'p', text: 'You will have an annual goal-setting conversation with your line manager, a midyear check-in, and an end-of-year review. Solidaridad expects honest, two-way feedback — not just from manager to staff, but also from you to your manager.' },
          { type: 'h', text: 'Development & training' },
          { type: 'p', text: 'You can access training budgets, cross-country learning labs, and self-paced courses on Jifunze (this platform). 50% of new roles will be filled through internal mobility by 2030 — grow within the network.' },
        ],
      },
      {
        id: 'gender-inclusion',
        title: 'Gender, Equality & Inclusion at Work',
        content: [
          { type: 'p', text: 'Solidaridad is committed to a workplace where women, youth, and people of all backgrounds can thrive — not just be present.' },
          { type: 'h', text: 'Our commitments by 2030' },
          { type: 'list', items: [
            '50% female representation in new hires and leadership roles',
            '25% of new roles filled through internal mobility',
            'Bias-aware recruitment, promotion, and pay decisions',
            'Zero tolerance for harassment, discrimination, or retaliation',
          ]},
          { type: 'h', text: 'What this means for you' },
          { type: 'list', items: [
            'Active inclusion is everyone\'s job — not just managers',
            'Speak up when you see exclusion or bias, even subtle forms',
            'Use Persons of Trust if you experience or witness misconduct',
            'Mentor colleagues, especially women and youth, into bigger roles',
          ]},
          { type: 'callout', text: 'Inclusion is part of integrity. It\'s not optional.' },
        ],
      },
      {
        id: 'integrity-snapshot',
        title: 'Integrity at a Glance',
        content: [
          { type: 'p', text: 'Solidaridad takes integrity seriously. Every staff member signs our Code of Conduct on joining. The full course is in your training plan — here\'s the snapshot:' },
          { type: 'list', items: [
            'Code of conduct — signed on joining, applies to everyone',
            'Whistleblower protocol — multiple safe channels to report',
            'Integrity coordinators — regional and global, ready to listen',
            'Persons of Trust — confidential, no obligation to escalate',
            'External whistleblower organisation — when internal channels feel unsafe',
          ]},
          { type: 'callout', text: 'When in doubt, ask. Inaction in the face of misconduct enables it.' },
          { type: 'highlight', text: 'Integrity is non-negotiable.' },
        ],
      },
      {
        id: 'tools-systems',
        title: 'Your Day-One Toolkit',
        content: [
          { type: 'p', text: 'You\'ll work across a few core systems from day one. Don\'t worry — IT and your team will help you set up. Here\'s the overview:' },
          { type: 'pathway', title: 'GMAIL & GOOGLE WORKSPACE', text: 'Email, Calendar, Drive, Docs, Meet. Your home base for daily work.' },
          { type: 'pathway', title: 'PLAZA (SALESFORCE)', text: 'Network-level project, opportunity, and grants management. Used by all RECs.' },
          { type: 'pathway', title: 'UWANJANI', text: 'Regional field data collection. For monitoring and evaluation across our programmes.' },
          { type: 'pathway', title: 'JIFUNZE', text: 'This platform! Self-paced learning, courses, and certificates.' },
          { type: 'pathway', title: 'COMMS TOOLS', text: 'LinkedIn (active personal accounts encouraged), Canva (we have a non-profit licence), and the brand templates in Google Drive.' },
          { type: 'callout', text: 'All accounts use your @solidaridadnetwork.org email — never a personal address for work.' },
        ],
      },
      {
        id: 'who-to-ask',
        title: 'Who to Ask for What',
        content: [
          { type: 'p', text: 'Knowing where to go saves time. Here\'s a quick map:' },
          { type: 'list', items: [
            'Day-to-day priorities, deliverables, performance — your line manager',
            'HR, contracts, leave, benefits — your country HR focal point',
            'IT, systems access, password resets — your country IT focal point or globally via the helpdesk',
            'Integrity concerns or someone you trust to talk to — your country Person of Trust or Integrity Coordinator',
            'Brand templates, comms support — your country / regional communications officer',
            'PMEL questions, indicators, reporting — your country MEL officer',
            'Finance, procurement, expense claims — your country finance team',
            'Strategy and programme design — the regional Programmes team',
          ]},
          { type: 'highlight', text: 'Karibu sana — welcome to Solidaridad!' },
        ],
      },
    ],
    interactive: {
      type: 'match-value',
      title: 'Match the Value to the Behaviour',
      pairs: [
        { value: 'SOLIDARITY', behaviour: 'Listening carefully to a farmer cooperative\'s concerns before proposing a programme.' },
        { value: 'SOLIDARITY', behaviour: 'Inviting workers, not just managers, to a workshop on labour conditions.' },
        { value: 'IMPACT-DRIVEN', behaviour: 'Measuring how many farmers earned a living income this year — not just how many were trained.' },
        { value: 'IMPACT-DRIVEN', behaviour: 'Cutting an activity that isn\'t delivering results to fund one that is.' },
        { value: 'SOLUTION-ORIENTED', behaviour: 'Designing a new financing model when banks won\'t lend to smallholders.' },
        { value: 'SOLUTION-ORIENTED', behaviour: 'Adapting a training format because farmers can\'t attend long workshops during harvest.' },
        { value: 'INTEGRITY', behaviour: 'Reporting a conflict of interest to your line manager.' },
        { value: 'INTEGRITY', behaviour: 'Reporting conservative, verified results to a donor — even when targets are missed.' },
      ],
    },
    quiz: [
      { q: 'In what year was Solidaridad founded?', options: ['1969', '1985', '1999', '2005'], answer: 0 },
      { q: 'How many countries does Solidaridad work in globally?', options: ['More than 10', 'More than 20', 'More than 40', 'More than 100'], answer: 2 },
      { q: 'What does the word "Solidaridad" mean?', options: ['Sustainability (Portuguese)', 'Solidarity (Spanish)', 'Community (Latin)', 'Partnership (Italian)'], answer: 1 },
      { q: 'Which is NOT one of our four core values?', options: ['Solidarity', 'Impact-driven', 'Profitability', 'Integrity'], answer: 2 },
      { q: 'Which label did Solidaridad help spark in the late 1980s?', options: ['Rainforest Alliance', 'Max Havelaar (Fair Trade coffee)', 'Organic EU', 'B Corp'], answer: 1 },
      { q: 'Where is Solidaridad East & Central Africa headquartered?', options: ['Addis Ababa', 'Kampala', 'Dar es Salaam', 'Nairobi'], answer: 3 },
      { q: 'Which countries are our four ECA "active" offices?', options: ['Kenya, Uganda, Rwanda, Tanzania', 'Ethiopia, Kenya, Tanzania, Uganda', 'Kenya, Tanzania, DRC, Burundi', 'Ethiopia, Kenya, Sudan, Tanzania'], answer: 1 },
      { q: 'What is our pay-off?', options: ['Farmers First', 'Change That Matters', 'Sustainability Now', 'Boots and Brains'], answer: 1 },
      { q: 'Our pay-off should be:', options: ['Translated to local languages', 'Used when it supports the content, never translated', 'Used everywhere always', 'Avoided in formal documents'], answer: 1 },
      { q: 'A "Person of Trust" is best used when:', options: ['You want to make a formal complaint', 'You need confidential advice without obligation to escalate', 'You want to bypass HR', 'You need legal representation'], answer: 1 },
      { q: 'By 2030, what % female representation are we targeting in new hires and leadership?', options: ['25%', '40%', '50%', '70%'], answer: 2 },
      { q: 'What % of new roles will be filled through internal mobility by 2030?', options: ['10%', '25%', '50%', '75%'], answer: 1 },
      { q: 'Who do you contact for an integrity concern?', options: ['Only HR', 'A Person of Trust or Integrity Coordinator', 'Post about it on social media', 'Your colleagues only'], answer: 1 },
      { q: 'What is Plaza used for?', options: ['Email', 'Network-level project and grants management (Salesforce)', 'Field data collection', 'Social media'], answer: 1 },
      { q: 'Which is NOT a phase of Solidaridad\'s evolution?', options: ['Movement support & consumer power (70s-80s)', 'Fair Trade labelling (late 80s-90s)', 'Stock market investing (2000s)', 'Producer-led systems change (2020s)'], answer: 2 },
    ],
  },
  {
    id: 'masp',
    title: 'MASP 2026-2030: Our Strategic Plan',
    subtitle: 'Regional strategy deep-dive',
    category: 'Strategy',
    icon: commodityIcon(maspIcon),
    duration: '40 min',
    description: 'A comprehensive walk-through of Solidaridad East & Central Africa\'s Multi-Annual Strategic Plan (MASP IV) — context, ambitions, theory of change, pathways, KPIs, and how it shapes everything we do.',
    lessons: [
      {
        id: 'masp-overview',
        title: 'Pathway to 2030',
        content: [
          { type: 'p', text: 'Sustainable Supply Chains, Thriving Farmers — Solidaridad East and Central Africa\'s Multi-Annual Strategic Plan (MASP IV) covers 2026 to 2030.' },
          { type: 'p', text: 'For over 15 years, Solidaridad has stood alongside the small-scale producers who nourish East and Central Africa, fuel its industries, and steward its landscapes.' },
          { type: 'highlight', text: 'Farmers First — always.' },
          { type: 'callout', text: 'Led by Rachel Wanyoike, Managing Director — Solidaridad East and Central Africa. Headquartered in Nairobi, Kenya.' },
          { type: 'p', text: 'MASP IV is our most ambitious plan yet. It expands reach from 687,500 stakeholders under MASP III to over 1.1 million by 2030. It deepens our work in agriculture, mining, and industry. And it puts producers — particularly women, youth, and marginalised groups — at the centre of system transformation.' },
        ],
      },
      {
        id: 'masp-context',
        title: 'The Context We Operate In',
        content: [
          { type: 'p', text: 'MASP IV responds to six interconnected realities shaping East & Central Africa today:' },
          { type: 'pathway', title: 'ECONOMIC & TRADE', text: 'Regional GDP growth of 4.7% in 2023, but uneven and threatened by debt (60%+ of GDP in several countries). 80% of workers are informal. AfCFTA and EAC create opportunities for cross-border trade.' },
          { type: 'pathway', title: 'CLIMATE VULNERABILITY', text: 'Agriculture is 40% of GDP and 80% of livelihoods. In 2024 Kenya saw its worst floods since 1950. Climate models predict rainfall up 35% in parts of Ethiopia/Uganda/Kenya by 2080, and down 4.5% in southern Tanzania.' },
          { type: 'pathway', title: 'SOCIAL INEQUALITY', text: 'Only 41% of women in secondary education. Women earn 19% less than men. Youth (60% of population) face >20% unemployment. Gini coefficients above 40 in all four ECA countries.' },
          { type: 'pathway', title: 'DIGITAL DIVIDE', text: 'Tech is transforming agriculture (M-Pesa, AgriPredict, FarmDrive), but rural connectivity, digital literacy, and affordable devices remain blockers — especially for women and youth.' },
          { type: 'pathway', title: 'GOVERNANCE & FINANCE', text: 'Policy fragmentation and shallow rural finance markets restrict producers. But decentralisation in Kenya and Tanzania, and Ethiopia\'s green growth framework, are opening doors.' },
          { type: 'pathway', title: 'DEMOGRAPHICS', text: '50% of ECA inhabitants will live in urban areas by 2030. Rural areas remain economically marginalised. Post-harvest losses reach 37%. Distress migration is rising.' },
        ],
      },
      {
        id: 'masp-ambitions',
        title: 'Five Bold Ambitions',
        content: [
          { type: 'p', text: 'Over the next five years, Solidaridad East & Central Africa will:' },
          { type: 'ambition', number: '650,000', label: 'Producers empowered', text: 'to adopt regenerative, climate-smart, and sustainable practices.' },
          { type: 'ambition', number: '200,000', label: 'Producers connected', text: 'to fair, transparent, competitive markets.' },
          { type: 'ambition', number: '€1.5M+', label: 'Finance mobilized', text: 'to unlock opportunities for small-scale producers and MSMEs.' },
          { type: 'ambition', number: '50/50', label: 'Equity & decent work', text: 'advancing women, youth, and marginalized groups.' },
          { type: 'ambition', number: '56', label: 'Policies influenced', text: 'mandatory regulations and voluntary frameworks improved.' },
          { type: 'highlight', text: 'Transformation that is locally-led and collectively sustained.' },
        ],
      },
      {
        id: 'masp-where-we-work',
        title: 'Where We Work',
        content: [
          { type: 'p', text: 'Solidaridad East and Central Africa has country offices in four active countries plus outreach in another four.' },
          { type: 'h', text: 'Active Countries' },
          { type: 'country', name: 'Ethiopia', commodities: ['Coffee', 'Livestock (Dairy)', 'Fashion (Cotton, Leather, Textiles)', 'Food Crops'] },
          { type: 'country', name: 'Kenya (Regional HQ)', commodities: ['Coffee', 'Tea', 'Livestock (Dairy)', 'Fruits & Vegetables', 'Food Crops', 'Gold'] },
          { type: 'country', name: 'Uganda', commodities: ['Coffee', 'Fashion (Cotton & Leather)', 'Spices', 'Tea', 'Fruits & Vegetables', 'Gold'] },
          { type: 'country', name: 'Tanzania', commodities: ['Coffee', 'Cocoa', 'Tea', 'Oil Palm', 'Fruits & Vegetables', 'Food Crops', 'Medicinal Herbs', 'Gold'] },
          { type: 'h', text: 'Outreach Countries' },
          { type: 'list', items: ['Burundi', 'Cameroon', 'Democratic Republic of Congo (DRC)', 'Rwanda'] },
          { type: 'callout', text: 'Across the region we work on 11 commodities in agriculture, industry, and mining.' },
        ],
      },
      {
        id: 'masp-target-groups',
        title: 'Who We Work For',
        content: [
          { type: 'p', text: 'Under MASP IV we will reach over 1.1 million stakeholders directly. The composition matters: we don\'t treat farmers as a monolithic group.' },
          { type: 'stat', number: '811,250', label: 'Small-scale farmers', detail: '55% men · 30% women · 15% youth' },
          { type: 'stat', number: '273,200', label: 'Workers', detail: '50% men · 30% women · 20% youth' },
          { type: 'stat', number: '30,000', label: 'Artisanal & Small-scale Miners (ASMs)', detail: '50% men · 30% women · 20% youth' },
          { type: 'stat', number: '303', label: 'MSMEs', detail: '50% youth- and/or women-led' },
          { type: 'stat', number: '250+', label: 'Civil Society Organizations', detail: 'Producer groups, cooperatives, unions' },
          { type: 'h', text: 'Farmer Archetypes' },
          { type: 'list', items: [
            'Archetype 1 (~80%): Households with up to 2 hectares — rain-fed, mixed farming, limited inputs/credit',
            'Archetype 2 (~15%): Households with 2-5 hectares — small-scale irrigation, better market and credit access',
            'Archetype 3 (<5%): Households with 5-20 hectares — advanced practices, key value chain contributors',
          ]},
        ],
      },
      {
        id: 'masp-pathways',
        title: 'Theory of Change: Four Pathways',
        content: [
          { type: 'p', text: 'Our Theory of Change links four interconnected pathways from producer level to policy level. Each follows an IF/THEN logic:' },
          { type: 'pathway', title: 'PRODUCTION (Producer level)', text: 'IF farmers and workers — especially women and youth — adopt regenerative, climate-smart practices with secure land rights and incentives like PES; THEN productivity rises, incomes grow, and ecosystems are restored.' },
          { type: 'pathway', title: 'SERVICES (Business level)', text: 'IF agribusinesses, cooperatives, and service providers deliver affordable, tailored services with inclusive business models and shared value; THEN producers gain access to finance, technology, and decent rural jobs.' },
          { type: 'pathway', title: 'MARKET (Market level)', text: 'IF producers connect to fair, transparent, diversified markets through digital tools and collective organisation; THEN they gain stable access, better prices, and value addition opportunities.' },
          { type: 'pathway', title: 'GOVERNANCE (Policy level)', text: 'IF governments enact policies that secure land rights and incentivise regenerative production, civil society raises citizen voices, and there is sustained political commitment; THEN systemic transformation toward resilient, inclusive economies follows.' },
          { type: 'highlight', text: 'Lasting impact emerges when empowered producers operate within supportive systems.' },
        ],
      },
      {
        id: 'masp-implementation',
        title: 'How We Deliver',
        content: [
          { type: 'p', text: 'Six interconnected strategies drive MASP IV implementation:' },
          { type: 'strategy', title: 'Integrated Supply Chain Transformation', text: 'End-to-end, country-specific strategies aligned with EUDR and CSDDD across coffee, cocoa, livestock, fruits & vegetables, fashion, oil palm, tea, food crops, gold, spices and herbs.' },
          { type: 'strategy', title: 'Community (and Sector)-Led Transformation', text: 'Lead farmers, trainers of trainers, gender champions, and TVETs cascade knowledge through Farmer Field Schools and peer exchanges.' },
          { type: 'strategy', title: 'Regenerative, Climate-Responsive Landscapes', text: 'Scaling agroforestry, carbon farming, PES schemes — building on pilots that enabled 9,423 farmers to earn ~€500,000 sequestering 22,045 tCO₂eq.' },
          { type: 'strategy', title: 'Inclusive & Sustainable Market Access', text: 'Trade fairs, B2B initiatives, partnerships with Decathlon, H&M, Starbucks, Volcafe, Touton, ECOM Group and others.' },
          { type: 'strategy', title: 'Sustainable Finance & Investment Ecosystems', text: 'Through ECA Agribusiness — mobilizing €1.5M via blended finance, debt, matching funds. Carbon pre-finance disbursed €397,200 to 33,100 coffee farmers in 2024.' },
          { type: 'strategy', title: 'Digital Systems & Intelligence', text: 'Solichain (blockchain traceability), e-Dairy, MRV dashboards, Carbon Academy, J\'Funze e-learning, Zwardy rewards, Uwanjani field data.' },
        ],
      },
      {
        id: 'masp-cross-cutting',
        title: 'Cross-Cutting Themes',
        content: [
          { type: 'p', text: 'Two themes run through every project, every country, every pathway:' },
          { type: 'h', text: 'Climate & Nature-Based Solutions' },
          { type: 'list', items: [
            'Climate risk assessments and vulnerability analyses in every project',
            'Climate-resilient development pathways embedded into design',
            'Agroforestry, biochar, regenerative agriculture, and low-carbon tech',
            'Capacity-building for access to carbon markets and PES schemes',
            'Indigenous Peoples actively engaged in climate decision-making',
          ]},
          { type: 'h', text: 'Gender, Equality & Social Inclusion (GESI)' },
          { type: 'p', text: 'GESI is a dedicated support pillar with proven methodologies:' },
          { type: 'list', items: [
            'GALS — Gender Action Learning System for participatory empowerment',
            'EMAP — Engaging Men in Accountable Practices',
            'EA$E — Economic and Social Empowerment for financial inclusion',
            'SASA! — Start Awareness Support Action for community advocacy',
            'Gender Smart Villages — integrated into farmer field schools',
          ]},
        ],
      },
      {
        id: 'masp-outcomes',
        title: 'Strategic Outcomes & KPIs',
        content: [
          { type: 'p', text: 'Four outcomes anchor MASP IV — each with measurable KPIs by 2030:' },
          { type: 'outcome', title: 'Outcome 1: Viable & Resilient Production Systems', kpis: ['649,000 farmers with improved farm viability', '1,298,000 tCO₂e/year sequestered or avoided', '936 agro-processors adopting cleaner technologies', '191,240 workers and ASMs under improved working conditions'] },
          { type: 'outcome', title: 'Outcome 2: Inclusive Service Delivery Systems', kpis: ['649,000 farmers accessing new or improved services', '37,500 new decent green jobs created', '64,900 farmers/workers (co-)owning businesses', '303 MSMEs accessing improved services'] },
          { type: 'outcome', title: 'Outcome 3: Enabling Policy Environment', kpis: ['56 mandatory regulations and voluntary frameworks improved', '40 partner companies with responsible procurement policies', '200 CSOs with enhanced policy influence'] },
          { type: 'outcome', title: 'Outcome 4: Inclusive Market Connection Systems', kpis: ['20 partner companies directly rewarding farmers', '194,700 small-scale producers receiving premium prices'] },
        ],
      },
      {
        id: 'masp-finance',
        title: 'Finance & Resources',
        content: [
          { type: 'p', text: 'Total forecasted income across the 2026-2030 period reflects ambitious but realistic resource mobilization:' },
          { type: 'finance', year: '2026', amount: '€9.6M' },
          { type: 'finance', year: '2027', amount: '€12.5M' },
          { type: 'finance', year: '2028', amount: '€11.4M' },
          { type: 'finance', year: '2029', amount: '€11.2M' },
          { type: 'finance', year: '2030', amount: '€11.1M' },
          { type: 'callout', text: 'Total secured to date: €7.7M. Active pipeline: €43.4M+. Beyond pipeline: €26.1M anticipated.' },
          { type: 'p', text: 'Funding is diversified across donors, multilaterals (EU, World Bank, DANIDA), philanthropic & climate finance partners (Gates Foundation, GCF, AfDB), and private sector co-investment (Acorn, Unilever, Starbucks, Louis Dreyfus, Syngenta).' },
        ],
      },
      {
        id: 'masp-risks',
        title: 'Key Risks & Mitigation',
        content: [
          { type: 'p', text: 'No strategy survives without managing risk. MASP IV anticipates six categories of risk:' },
          { type: 'list', items: [
            'Political & institutional — managed via contingency planning and stakeholder mapping',
            'Environmental — aligned with national regulations and impact assessments',
            'Operational — automated systems, due diligence, structured M&E',
            'Financial, fraud & misconduct — zero-tolerance, real-time tracking, whistleblower channels',
            'Contagion — diversified revenue sources beyond traditional fundraising',
            'Currency fluctuation — foreign currency accounts and inflation-adjusted budgets',
          ]},
          { type: 'callout', text: 'Risk is identified annually and reviewed quarterly. Every team contributes to the risk register.' },
        ],
      },
      {
        id: 'masp-your-role',
        title: 'How MASP Shapes Your Work',
        content: [
          { type: 'p', text: 'MASP isn\'t just a document — it shapes your day-to-day. Here\'s how:' },
          { type: 'list', items: [
            'Every project proposal must map to one or more MASP outcomes',
            'Your annual goals should connect to a MASP KPI',
            'Quarterly progress reports feed up to outcome-level reporting',
            'Cross-country learning is encouraged — replicate what works',
            'Innovations get piloted, learned from, and scaled',
          ]},
          { type: 'highlight', text: 'If your work doesn\'t move us toward an outcome, ask why.' },
          { type: 'p', text: 'The full MASP IV strategy document is available in the Knowledge Hub. Read it. Discuss it with your team. It is the foundation of everything we do for the next five years.' },
        ],
      },
    ],
    interactive: {
      type: 'country-commodity',
      title: 'Match Commodities to ECA Countries',
      countries: {
        'Ethiopia': ['Coffee', 'Livestock (Dairy)', 'Fashion (Cotton, Leather, Textiles)', 'Food Crops'],
        'Kenya': ['Coffee', 'Tea', 'Livestock (Dairy)', 'Fruits & Vegetables', 'Food Crops', 'Gold'],
        'Uganda': ['Coffee', 'Fashion (Cotton & Leather)', 'Spices', 'Tea', 'Fruits & Vegetables', 'Gold'],
        'Tanzania': ['Coffee', 'Cocoa', 'Tea', 'Oil Palm', 'Fruits & Vegetables', 'Food Crops', 'Medicinal Herbs', 'Gold'],
      },
      questions: [
        { commodity: 'Cocoa', answer: 'Tanzania' },
        { commodity: 'Oil Palm', answer: 'Tanzania' },
        { commodity: 'Medicinal Herbs', answer: 'Tanzania' },
        { commodity: 'Spices', answer: 'Uganda' },
        { commodity: 'Fashion (Cotton, Leather, Textiles)', answer: 'Ethiopia' },
        { commodity: 'Tea (largest producer in ECA)', answer: 'Kenya' },
        { commodity: 'Livestock (Dairy) — Ethiopian focus', answer: 'Ethiopia' },
      ],
    },
    quiz: [
      { q: 'How many small-scale producers will adopt climate-smart practices under MASP IV?', options: ['250,000', '500,000', '650,000', '1 million'], answer: 2 },
      { q: 'Where is Solidaridad East & Central Africa headquartered?', options: ['Addis Ababa', 'Kampala', 'Dar es Salaam', 'Nairobi'], answer: 3 },
      { q: 'Who is the Managing Director of Solidaridad East & Central Africa?', options: ['Andre de Freitas', 'Rachel Wanyoike', 'Philemon Cheruiyot', 'Dorothy Masaki'], answer: 1 },
      { q: 'Which four pathways anchor the Theory of Change?', options: ['Research, Trade, Finance, Climate', 'Production, Services, Market, Governance', 'Farmers, Workers, Miners, MSMEs', 'Africa, Asia, LatAm, Europe'], answer: 1 },
      { q: 'Which commodity is unique to Tanzania among ECA active countries?', options: ['Coffee', 'Tea', 'Cocoa', 'Gold'], answer: 2 },
      { q: 'How many producers will be connected to fair markets under MASP IV?', options: ['100,000', '200,000', '500,000', '1 million'], answer: 1 },
      { q: 'What time period does MASP IV cover?', options: ['2020-2025', '2024-2028', '2026-2030', '2025-2035'], answer: 2 },
      { q: 'Which is NOT one of our four ECA active countries?', options: ['Ethiopia', 'Kenya', 'Rwanda', 'Tanzania'], answer: 2 },
      { q: 'How many regulations and voluntary frameworks will MASP IV influence?', options: ['10', '25', '56', '100'], answer: 2 },
      { q: 'What is the MASP IV tagline?', options: ['Farmers First, Always', 'Sustainable Supply Chains, Thriving Farmers', 'Change That Matters', 'Producers at the Centre'], answer: 1 },
      { q: 'What % of farmers are in Archetype 1 (≤2 hectares)?', options: ['About 50%', 'About 65%', 'About 80%', 'About 95%'], answer: 2 },
      { q: 'Approximately how much income is forecast for 2027?', options: ['€5M', '€9.6M', '€12.5M', '€20M'], answer: 2 },
      { q: 'Which methodology promotes participatory gender empowerment?', options: ['GALS', 'EUDR', 'MRV', 'PMEL'], answer: 0 },
      { q: 'How many tCO₂e/year will be sequestered or avoided by 2030?', options: ['100,000', '500,000', '1,298,000', '10 million'], answer: 2 },
      { q: 'Which sectors does Solidaridad ECA work in?', options: ['Just agriculture', 'Agriculture, industry, and mining', 'Banking and finance', 'Tech and telecoms'], answer: 1 },
    ],
  },
  {
    id: 'integrity',
    title: 'Code of Conduct & Whistleblower Protocol',
    subtitle: 'Ethics & accountability',
    category: 'Compliance',
    icon: commodityIcon(integrityIcon),
    duration: '25 min',
    description: 'Understand the ethical standards that guide our work. Learn how to recognize misconduct and the safe channels available to report concerns.',
    lessons: [
      {
        id: 'integrity-overview',
        title: 'Integrity Framework',
        content: [
          { type: 'p', text: 'Solidaridad takes integrity seriously. We have organizational measures in place to prevent, monitor, and be held accountable for financial misconduct, misuse of power, or interpersonal misconduct.' },
          { type: 'list', items: [
            'A code of conduct that every staff member signs upon joining.',
            'A whistle-blowing protocol with reporting procedures and victim support.',
            'Global and regional integrity coordinators providing a safe environment to speak up.',
          ]},
        ],
      },
      {
        id: 'whistleblower',
        title: 'Whistleblower Protocol',
        content: [
          { type: 'p', text: 'If you are concerned about possible misconduct, you have multiple safe paths to report:' },
          { type: 'list', items: [
            'Your line manager (or their supervisor)',
            'The Managing Director of your Regional Expertise Centre (REC)',
            'The Executive Director of Solidaridad Network',
            'The Chairperson of the International Supervisory Board',
            'The REC\'s Integrity Advisor',
            'The External Whistleblower Organization',
          ]},
          { type: 'callout', text: 'If you don\'t know where to go, talk to a Person of Trust first. They will listen without obligation.' },
        ],
      },
      {
        id: 'governance',
        title: 'Network Governance',
        content: [
          { type: 'p', text: 'Solidaridad is a network organization. All regions have their own Managing Director and Continental Supervisory Board (CSB).' },
          { type: 'p', text: 'The International Supervisory Board (ISB) sits at the highest level — monitoring policies, programme quality, financial control, and the Executive Board of Directors (EBoD).' },
          { type: 'highlight', text: 'We are truly locally-managed and governed.' },
        ],
      },
      {
        id: 'scenarios-intro',
        title: 'Recognizing Misconduct',
        content: [
          { type: 'p', text: 'Misconduct can take many forms. Watch for:' },
          { type: 'list', items: [
            'Financial irregularities — missing receipts, unexplained payments, conflicts of interest',
            'Misuse of power — favouritism, retaliation, intimidation',
            'Interpersonal misconduct — harassment, discrimination, bullying',
            'Safety violations — covering up incidents, ignoring protocols',
          ]},
          { type: 'callout', text: 'When in doubt, ask. Persons of Trust exist precisely for unclear situations.' },
        ],
      },
      {
        id: 'reporting',
        title: 'Safe Reporting Channels',
        content: [
          { type: 'p', text: 'Solidaridad protects whistleblowers through a formal Victim Support and Protection Policy.' },
          { type: 'list', items: [
            'Retaliation against whistleblowers is prohibited and itself a violation',
            'Reports are investigated through a structured protocol',
            'External whistleblower organization available when internal channels feel unsafe',
            'Confidentiality is maintained throughout the investigation',
          ]},
        ],
      },
    ],
    interactive: {
      type: 'scenario',
      title: 'What Should You Do? (Scenarios)',
      scenarios: [
        {
          situation: 'A colleague repeatedly makes inappropriate comments toward another team member. You\'ve seen it twice.',
          options: [
            { text: 'Ignore it — it\'s between them.', correct: false, feedback: 'Inaction enables misconduct. Solidaridad expects you to act.' },
            { text: 'Talk to a Person of Trust or your line manager.', correct: true, feedback: 'Correct. Persons of Trust provide a safe environment to discuss concerns.' },
            { text: 'Post about it on social media.', correct: false, feedback: 'Public posts can harm both the victim and the investigation.' },
          ],
        },
        {
          situation: 'You discover a financial irregularity in a project budget but you\'re afraid to report it directly.',
          options: [
            { text: 'Delete the evidence and move on.', correct: false, feedback: 'Never. This could make you complicit.' },
            { text: 'Contact the External Whistleblower Organization.', correct: true, feedback: 'Correct. The external channel exists for situations where internal reporting feels unsafe.' },
            { text: 'Wait until someone else notices.', correct: false, feedback: 'Delay can worsen harm.' },
          ],
        },
        {
          situation: 'You\'re unsure whether something even counts as misconduct.',
          options: [
            { text: 'Assume it\'s fine and move on.', correct: false, feedback: 'When unsure, ask. Persons of Trust are there for exactly this.' },
            { text: 'Talk to a Person of Trust to think it through.', correct: true, feedback: 'Correct. You can talk to a Person of Trust without any obligation to formally report.' },
            { text: 'Send an anonymous email to all staff.', correct: false, feedback: 'Mass emails about suspicions can harm innocent people.' },
          ],
        },
      ],
    },
    quiz: [
      { q: 'Every staff member signs which document on joining?', options: ['NDA only', 'Code of conduct', 'Salary agreement only', 'Travel policy'], answer: 1 },
      { q: 'Who can you talk to confidentially without obligation to report?', options: ['HR only', 'A Person of Trust', 'The press', 'Your colleagues'], answer: 1 },
      { q: 'What does CSB stand for?', options: ['Central Service Board', 'Continental Supervisory Board', 'Country Strategy Board', 'Compliance & Safety Body'], answer: 1 },
      { q: 'Our differentiating governance feature is:', options: ['Centralised HQ control', 'Locally-managed and governed network', 'Donor-led decision making', 'Fully volunteer-run'], answer: 1 },
      { q: 'If internal reporting feels unsafe, where can you go?', options: ['Just stay silent', 'The External Whistleblower Organization', 'The local press', 'Anonymous social media'], answer: 1 },
      { q: 'What does ISB stand for?', options: ['Internal Strategy Board', 'International Supervisory Board', 'Internal Safety Bureau', 'Integrity Standards Body'], answer: 1 },
      { q: 'Which is NOT a form of misconduct covered by our integrity framework?', options: ['Financial misconduct', 'Misuse of power', 'Personal lifestyle choices', 'Interpersonal misconduct (harassment)'], answer: 2 },
      { q: 'Is retaliation against a whistleblower permitted?', options: ['Yes, if justified', 'No — it is itself a violation', 'Only by senior managers', 'Only under specific conditions'], answer: 1 },
      { q: 'What happens if you witness inappropriate behaviour and do nothing?', options: ['It\'s neutral — not your concern', 'Inaction can enable misconduct; you should act', 'Only HR is responsible', 'Solidaridad takes no view on this'], answer: 1 },
      { q: 'Confidentiality during investigations is:', options: ['Optional', 'Maintained throughout the process', 'Only for senior staff', 'Public by default'], answer: 1 },
    ],
  },
];


COURSES.push(
  {
    id: 'ethics',
    title: 'Navigating Ethical Dilemmas',
    subtitle: 'Real-world decision making',
    category: 'Ethics',
    icon: commodityIcon(ethicsIcon),
    duration: '40 min',
    description: 'Practice navigating real ethical dilemmas Solidaridad teams face in the field — from results reporting to private sector partnerships, carbon credits, and internal controls.',
    lessons: [
      {
        id: 'ethics-overview',
        title: 'Why Ethics Matter',
        content: [
          { type: 'p', text: 'Ethical dilemmas rarely come with obvious right answers. They emerge precisely when two things we value — impact and accuracy, speed and process, market access and standards — pull in different directions.' },
          { type: 'p', text: 'Solidaridad\'s integrity framework gives us a foundation, but the day-to-day judgement still falls on each of us. This course walks through six real situations field teams have faced.' },
          { type: 'highlight', text: 'When values collide, integrity becomes the deciding test.' },
          { type: 'callout', text: 'The goal is not to memorise "correct" answers, but to practise reasoning through trade-offs the Solidaridad way.' },
        ],
      },
      {
        id: 'ethics-framework',
        title: 'A Framework for Tough Calls',
        content: [
          { type: 'p', text: 'When you face an ethical dilemma, work through these five questions before deciding:' },
          { type: 'list', items: [
            'Whose interests are at stake — farmers, donors, partners, colleagues, or the organization?',
            'Which Solidaridad value applies most directly — solidarity, impact-driven, solution-oriented, or integrity?',
            'What does our code of conduct or relevant policy say?',
            'Is there a third option that honours multiple values at once?',
            'Could I defend this decision openly to farmers, donors, and colleagues?',
          ]},
          { type: 'callout', text: 'If you can\'t comfortably explain a decision to all stakeholders, that\'s a strong signal to reconsider.' },
        ],
      },
      {
        id: 'ethics-redflags',
        title: 'Common Red Flags',
        content: [
          { type: 'p', text: 'Certain phrases or situations should always slow you down:' },
          { type: 'list', items: [
            '"We can regularise the paperwork later."',
            '"The results are very likely there, we just don\'t have the data yet."',
            '"This partner has issues, but our influence will fix them."',
            '"Everyone else does it this way."',
            '"It\'s just this once, due to timeline pressure."',
            '"Senior management informally said it\'s fine."',
          ]},
          { type: 'callout', text: 'These aren\'t automatically wrong — but each deserves a pause and a conversation, not a quick decision.' },
        ],
      },
      {
        id: 'ethics-support',
        title: 'Where to Turn for Support',
        content: [
          { type: 'p', text: 'You don\'t need to navigate dilemmas alone. Solidaridad offers multiple sources of support:' },
          { type: 'list', items: [
            'Your line manager — first port of call for most dilemmas',
            'A Person of Trust — confidential, no obligation to formally report',
            'The Regional Integrity Coordinator — for matters specific to your REC',
            'The Global Integrity Coordinator — for cross-regional or escalated issues',
            'The External Whistleblower Organization — when internal channels feel unsafe',
          ]},
          { type: 'highlight', text: 'Asking for help is a sign of integrity, not weakness.' },
        ],
      },
    ],
    interactive: {
      type: 'scenario',
      title: 'Six Ethical Dilemmas',
      scenarios: [
        {
          situation: 'A flagship programme is nearing closure. Reported outcomes fall slightly below donor targets. A programme manager suggests using "reasonable assumptions" and extrapolations to present results as fully achieved, arguing the impact is "very likely" there and future verification would confirm it.',
          options: [
            { text: 'Adjust the figures upward — the impact is "likely" there anyway.', correct: false, feedback: 'Reporting unverified estimates as achieved results misleads donors and undermines our credibility. Solidaridad\'s integrity value is non-negotiable, even at the cost of future funding.' },
            { text: 'Report only the conservative, verified results and explain the gap honestly to the donor.', correct: true, feedback: 'Correct. Transparency protects long-term trust. Most donors respect honest reporting and underperformance discussions far more than inflated claims that later unravel.' },
            { text: 'Quietly delay the report until more data arrives.', correct: false, feedback: 'Avoidance is not a solution. Report what you know, when you said you would, and document the reasons for any gaps.' },
          ],
        },
        {
          situation: 'A major private sector partner (offtaker) offers a large contract that would significantly benefit farmers. However, due diligence flags labour and environmental risks. Their sustainability practices are questionable but improving. Rejecting them could mean farmers lose immediate market access.',
          options: [
            { text: 'Sign quickly — farmers need market access now and we can address concerns later.', correct: false, feedback: 'Signing without safeguards exposes Solidaridad and farmers to reputational and ethical risk. "Address it later" rarely happens once the contract is signed.' },
            { text: 'Reject outright — their standards don\'t meet ours.', correct: false, feedback: 'A blanket rejection may protect us but abandons farmers who depend on market access. Engagement with clear conditions is often the more solidaristic path.' },
            { text: 'Engage on conditional terms — agree to the contract with binding sustainability milestones, monitoring, and the right to exit if commitments aren\'t met.', correct: true, feedback: 'Correct. This honours both our impact-driven and integrity values — securing market access for farmers while holding the partner accountable to credible improvement.' },
          ],
        },
        {
          situation: 'A carbon project is progressing well on the ground — farmers are adopting agroforestry practices. But MRV systems are delayed and verification is incomplete. There is pressure to issue or pre-sell carbon credits to maintain investor confidence.',
          options: [
            { text: 'Issue credits based on projections — verification will catch up.', correct: false, feedback: 'Issuing unverified credits is fraud in carbon markets. It would destroy Solidaridad\'s credibility with investors and could expose the organization to legal action.' },
            { text: 'Delay all farmer payments until verification is complete.', correct: false, feedback: 'Farmers shouldn\'t bear the cost of MRV system delays. There are better tools available.' },
            { text: 'Use pre-financing (loans against future verified credits) to maintain farmer payments, but only issue actual credits after full verification.', correct: true, feedback: 'Correct. This is precisely the model ECA Agribusiness uses — €397,200 in carbon pre-finance was disbursed to 33,100 farmers in 2024 against future verified credits. It protects MRV integrity without breaking the farmer pipeline.' },
          ],
        },
        {
          situation: 'A country team is under timeline pressure. Procurement and payment processes are seen as slow. A senior manager informally instructs the team to bypass certain approval steps and "regularise the documentation later."',
          options: [
            { text: 'Follow the instruction — it came from senior management and delivery matters.', correct: false, feedback: 'Informal instructions to bypass controls are exactly what whistleblower protocols are designed to catch. Senior authority does not override compliance.' },
            { text: 'Follow Zoho workflows fully and document the timeline issues in writing, escalating to your line manager or a Person of Trust if pressure continues.', correct: true, feedback: 'Correct. Bypassing controls "just this once" creates audit risks and normalises corner-cutting. Document the pressure and use formal channels.' },
            { text: 'Make the bypass yourself but don\'t tell anyone.', correct: false, feedback: 'This makes you personally accountable for any audit findings and protects the manager who gave the instruction. Never absorb compliance risk informally.' },
          ],
        },
        {
          situation: 'A respected colleague asks you to share confidential beneficiary data (names, contacts, photos) with a researcher from a partner university. They argue it\'s "for a good cause" and the researcher is "trustworthy."',
          options: [
            { text: 'Share the data — it\'s for research that could benefit farmers.', correct: false, feedback: 'Sharing beneficiary data without explicit informed consent and a data-sharing agreement violates Solidaridad\'s data governance principles and may breach data protection laws.' },
            { text: 'Refuse and explain that any data sharing requires informed consent from beneficiaries and a formal data-sharing agreement reviewed by the appropriate teams.', correct: true, feedback: 'Correct. Privacy, consent, and ethical data reuse are core Solidaridad principles. The researcher\'s good intentions don\'t override consent requirements.' },
            { text: 'Share an anonymised version without checking the agreement.', correct: false, feedback: 'Even "anonymised" data can often be re-identified. Always route data requests through the proper governance process before sharing anything.' },
          ],
        },
        {
          situation: 'During a field visit, you notice that a local implementing partner has inflated farmer attendance numbers in their training records. The lead trainer privately tells you the real numbers are about 60% of what was reported. The partner\'s contract is nearly complete and they are highly valued.',
          options: [
            { text: 'Say nothing — the project is almost over and confrontation could damage the relationship.', correct: false, feedback: 'Silence makes you complicit in the misrepresentation. The issue won\'t end with this contract — it will recur.' },
            { text: 'Confront the partner publicly during a project meeting.', correct: false, feedback: 'Public confrontation rarely leads to good outcomes. Misconduct should be addressed through proper channels, not in front of stakeholders.' },
            { text: 'Document what you observed, report it to your line manager and the Regional Integrity Coordinator, and ensure proper investigation before final payment is made.', correct: true, feedback: 'Correct. This protects Solidaridad and donors while allowing for fair investigation. The partner deserves due process, but inflated reporting can\'t be ignored — and final payments should follow verified results.' },
          ],
        },
      ],
    },
    quiz: [
      { q: 'When reported results fall short of donor targets, the correct response is to:', options: ['Use reasonable assumptions to meet targets', 'Report conservative, verified results and explain the gap honestly', 'Delay reporting until more data arrives', 'Hide the underperformance'], answer: 1 },
      { q: 'A flagged partner offers farmers market access. The best approach is usually to:', options: ['Sign quickly to secure access', 'Reject outright', 'Engage on conditional terms with binding sustainability milestones', 'Outsource the decision to the donor'], answer: 2 },
      { q: 'When carbon MRV is incomplete, what should NOT happen?', options: ['Pre-financing against future verified credits', 'Continued farmer training', 'Issuing unverified credits as if they are real', 'Delaying credit issuance until verified'], answer: 2 },
      { q: 'A senior manager informally asks you to bypass procurement controls. You should:', options: ['Comply — it\'s a senior instruction', 'Bypass quietly to save time', 'Follow full process and document the pressure', 'Resign immediately'], answer: 2 },
      { q: 'A researcher asks for beneficiary contact details "for a good cause." You should:', options: ['Share — research benefits farmers', 'Refuse and require informed consent + a data-sharing agreement', 'Share anonymised data without checking', 'Ask the farmers later'], answer: 1 },
      { q: 'You find a partner has inflated training attendance figures. The right action is:', options: ['Stay silent — the project is ending', 'Confront them publicly', 'Document and report through proper channels with investigation before final payment', 'Cancel the contract immediately without investigation'], answer: 2 },
      { q: 'Which phrase is a red flag in an ethical decision?', options: ['"Let\'s consult the policy"', '"We can regularise the paperwork later"', '"I want to escalate this concern"', '"Let me check with the integrity coordinator"'], answer: 1 },
      { q: 'The five-question framework for tough calls does NOT include:', options: ['Whose interests are at stake?', 'Which Solidaridad value applies most directly?', 'Could I defend this openly to all stakeholders?', 'Which option is fastest?'], answer: 3 },
      { q: 'A Person of Trust is best used when:', options: ['You want to formally accuse someone', 'You need confidential advice without obligation to report', 'You want to bypass HR', 'You need legal representation'], answer: 1 },
      { q: 'In ethical reasoning, the strongest signal that you should reconsider is:', options: ['It will take longer', 'You cannot comfortably explain the decision to all stakeholders', 'A colleague disagrees', 'It requires more paperwork'], answer: 1 },
    ],
  },
  {
    id: 'climate',
    title: 'Climate & Natural Resource Management',
    subtitle: 'Regenerative landscapes',
    category: 'Climate & NRM',
    icon: commodityIcon(climateIcon),
    duration: '20 min',
    description: 'Learn how Solidaridad embeds climate adaptation, mitigation, and nature-based solutions across agriculture, mining, and industry.',
    lessons: [
      {
        id: 'climate-context',
        title: 'Climate Vulnerability in ECA',
        content: [
          { type: 'p', text: 'East and Central African economies depend on agriculture for ~40% of GDP and ~80% of livelihoods, making them highly vulnerable to climate shocks.' },
          { type: 'list', items: [
            'Kenya 2024: most severe floods since 1950 — 188 lives lost, 200,000+ displaced',
            'Ethiopia & Somalia: chronic droughts decimating livestock and groundwater',
            '40%+ of East African soils are degraded',
            'Sub-Saharan Africa lost 4.4M hectares of forest annually (2015-2020)',
          ]},
        ],
      },
      {
        id: 'regenerative-agriculture',
        title: 'Regenerative Agriculture',
        content: [
          { type: 'p', text: 'Our approach integrates regenerative practices into circular production models:' },
          { type: 'pathway', title: 'AGROECOLOGY', text: 'Working with natural systems rather than against them.' },
          { type: 'pathway', title: 'AGROFORESTRY', text: 'Integrating trees with crops — improving soil, biodiversity, and carbon storage.' },
          { type: 'pathway', title: 'CROP ROTATION', text: 'Maintaining soil health and breaking pest cycles.' },
          { type: 'pathway', title: 'COVER CROPPING', text: 'Protecting and building soil between productive cycles.' },
        ],
      },
      {
        id: 'carbon-markets',
        title: 'Carbon Markets & PES',
        content: [
          { type: 'p', text: 'Solidaridad connects small-scale producers to global carbon markets through Payment for Ecosystem Services (PES) schemes.' },
          { type: 'highlight', text: '9,423 farmers earned ~€500,000 by sequestering 22,045 tCO₂eq across 27,270 hectares.' },
          { type: 'p', text: 'In 2024, ECA Agribusiness disbursed over €397,200 in carbon pre-finance loans to 33,100 coffee farmers — expanding access to carbon markets while enhancing resilience.' },
        ],
      },
      {
        id: 'nature-based',
        title: 'Nature-Based Solutions',
        content: [
          { type: 'p', text: 'Ecosystem-based adaptation is scaled alongside sustainable processing:' },
          { type: 'list', items: [
            'Watershed restoration',
            'Tree planting and reforestation',
            'Nature-based infrastructure',
            'Biochar application for soil health',
            'Solar-powered milk chillers and irrigation',
            'Responsible small-scale mining practices',
          ]},
        ],
      },
      {
        id: 'eudr',
        title: 'EUDR & Compliance',
        content: [
          { type: 'p', text: 'International regulations are tightening:' },
          { type: 'list', items: [
            'EU Deforestation Regulation (EUDR) — traceability requirements',
            'Corporate Sustainability Due Diligence Directive (CSDDD)',
            'Responsible Business Conduct (RBC) guidelines',
            'Environmental, Social & Governance (ESG) standards',
          ]},
          { type: 'callout', text: 'Solidaridad supports producers with compliance tools — including Solichain, our blockchain traceability platform.' },
        ],
      },
    ],
    interactive: {
      type: 'spelling-sort',
      title: 'Climate-Smart vs. Conventional Practices',
      pairs: [
        { correct: 'Agroforestry', incorrect: 'Monoculture plantation' },
        { correct: 'Cover cropping', incorrect: 'Bare fallow soil' },
        { correct: 'Drip irrigation', incorrect: 'Flood irrigation' },
        { correct: 'Composting', incorrect: 'Synthetic-only fertilizer' },
        { correct: 'Solar dryers', incorrect: 'Diesel dryers' },
        { correct: 'Integrated pest management', incorrect: 'Broad-spectrum pesticide spraying' },
      ],
    },
    quiz: [
      { q: 'What % of East African soils are degraded?', options: ['10%', '20%', 'Over 40%', '90%'], answer: 2 },
      { q: 'What does EUDR stand for?', options: ['European Union Development Regulation', 'EU Deforestation Regulation', 'Equatorial Uniform Diet Requirements', 'EU Drought Response'], answer: 1 },
      { q: 'Approximately how many tCO₂eq were sequestered by 9,423 farmers in our agroforestry pilot?', options: ['2,000', '22,045', '100,000', '1 million'], answer: 1 },
      { q: 'Which is NOT a nature-based solution?', options: ['Watershed restoration', 'Tree planting', 'Synthetic fertilizer expansion', 'Biochar application'], answer: 2 },
      { q: 'PES stands for:', options: ['Producer Economic Support', 'Payment for Ecosystem Services', 'Plant Environment System', 'Pesticide Evaluation Standard'], answer: 1 },
      { q: 'What % of ECA economies\' GDP depends on agriculture?', options: ['~10%', '~20%', '~40%', '~80%'], answer: 2 },
      { q: 'What % of ECA livelihoods depend on agriculture?', options: ['~30%', '~50%', '~80%', '~95%'], answer: 2 },
      { q: 'Which 2024 event in Kenya was the most severe since 1950?', options: ['Drought', 'Floods', 'Locust swarm', 'Earthquake'], answer: 1 },
      { q: 'Which is a key practice in regenerative agriculture?', options: ['Monoculture', 'Cover cropping', 'Heavy tillage', 'Synthetic-only inputs'], answer: 1 },
      { q: 'How much carbon pre-finance was disbursed to 33,100 coffee farmers in 2024?', options: ['€50,000', '€100,000', '€397,200', '€1 million'], answer: 2 },
    ],
  },
  {
    id: 'finance',
    title: 'Access to Finance',
    subtitle: 'Inclusive financial ecosystems',
    category: 'Access to Finance',
    icon: commodityIcon(financeIcon),
    duration: '25 min',
    description: 'Discover how Solidaridad mobilizes responsible finance for small-scale producers, MSMEs, and community enterprises across East & Central Africa.',
    lessons: [
      {
        id: 'finance-barriers',
        title: 'Financial Access Barriers',
        content: [
          { type: 'p', text: 'Small-scale farmers, MSMEs, women, and youth-led enterprises face acute barriers to financing:' },
          { type: 'list', items: [
            'High interest rates',
            'Onerous collateral requirements',
            'Limited tailored products for agricultural seasonality',
            'Low insurance penetration — climate losses borne by producers',
            'Shallow rural financial markets',
          ]},
        ],
      },
      {
        id: 'eca-agribusiness',
        title: 'ECA Agribusiness',
        content: [
          { type: 'p', text: 'ECA Agribusiness is Solidaridad\'s social enterprise. Under MASP IV it will mobilize €1.5 million through grants, blended finance, debt, matching funds, and consultancy services.' },
          { type: 'p', text: 'Product offerings extend beyond agroforestry inputs to include:' },
          { type: 'list', items: [
            'Solar irrigation systems',
            'Solar dryers and lamps',
            'Chaff cutters and drying canvas',
            'Productivity-enhancing technologies',
            'Renewable energy solutions',
          ]},
        ],
      },
      {
        id: 'blended-finance',
        title: 'Blended Finance Approach',
        content: [
          { type: 'p', text: 'Our four-pillar approach to expanding financial access:' },
          { type: 'pathway', title: 'DATA & EVIDENCE', text: 'Develop viable business cases using field data to demonstrate ROI.' },
          { type: 'pathway', title: 'DIGITAL TOOLS', text: 'Deploy platforms for loan management, repayment tracking, and transparency.' },
          { type: 'pathway', title: 'TAILORED SOLUTIONS', text: 'Co-design credit, savings, payments, and insurance for cooperatives and women-led MSMEs.' },
          { type: 'pathway', title: 'PILOT, LEARN, SCALE', text: 'Test innovative financial products and scale what works.' },
        ],
      },
      {
        id: 'carbon-finance',
        title: 'Carbon Finance in Practice',
        content: [
          { type: 'p', text: 'Carbon pre-finance has unlocked early investment in regenerative practices.' },
          { type: 'highlight', text: '€397,200 disbursed to 33,100 coffee farmers in 2024 — expanding access to carbon markets.' },
          { type: 'p', text: 'These pilots build the foundation for scaled climate finance flows to small-scale producers across ECA.' },
        ],
      },
    ],
    interactive: {
      type: 'scenario',
      title: 'Designing a Financial Product (Scenarios)',
      scenarios: [
        {
          situation: 'A women-led coffee cooperative wants to buy solar dryers but has no collateral and no formal credit history.',
          options: [
            { text: 'Reject — they don\'t qualify under standard banking criteria.', correct: false, feedback: 'This perpetuates exclusion. Standard banking criteria don\'t fit smallholders.' },
            { text: 'Co-design an asset-financing product secured by the dryers themselves, with seasonal repayment.', correct: true, feedback: 'Correct. Tailored products de-risk lending while serving real producer needs.' },
            { text: 'Give them a free dryer and hope they figure it out.', correct: false, feedback: 'Grants without financing build dependence, not enterprise.' },
          ],
        },
        {
          situation: 'Smallholders want to adopt agroforestry but the income gap until trees mature is 3-5 years.',
          options: [
            { text: 'Tell them to wait until they have savings.', correct: false, feedback: 'Most can\'t. The financing gap is exactly why most don\'t adopt.' },
            { text: 'Offer carbon pre-finance loans against future sequestration credits.', correct: true, feedback: 'Correct. Pre-finance bridges the income gap and unlocks regenerative adoption.' },
            { text: 'Recommend they switch to monoculture instead.', correct: false, feedback: 'This works against our climate and resilience goals.' },
          ],
        },
      ],
    },
    quiz: [
      { q: 'How much will ECA Agribusiness mobilize under MASP IV?', options: ['€500,000', '€1 million', '€1.5 million', '€10 million'], answer: 2 },
      { q: 'In 2024, how many coffee farmers received carbon pre-finance loans?', options: ['1,000', '5,000', '33,100', '100,000'], answer: 2 },
      { q: 'Which is NOT a typical barrier for smallholder finance?', options: ['High interest rates', 'Collateral requirements', 'Too many product options', 'Lack of seasonal terms'], answer: 2 },
      { q: 'Blended finance combines:', options: ['Only grants', 'Public/concessional + private capital', 'Crypto and fiat', 'Personal savings'], answer: 1 },
      { q: 'Which is an example of asset-financing?', options: ['Free cash gift', 'Loan secured by solar irrigation equipment', 'Tax refund', 'Salary advance'], answer: 1 },
      { q: 'ECA Agribusiness is best described as:', options: ['A donor', 'Solidaridad\'s social enterprise', 'A government agency', 'A multinational bank'], answer: 1 },
      { q: 'Why do most smallholder farmers struggle to access traditional bank loans?', options: ['They don\'t want them', 'Lack of collateral and formal credit history', 'Banks are closed', 'Loans are illegal in ECA'], answer: 1 },
      { q: 'Which product is NOT offered through ECA Agribusiness?', options: ['Solar irrigation', 'Solar dryers', 'Stock market shares', 'Chaff cutters'], answer: 2 },
      { q: 'What is the purpose of climate-smart insurance?', options: ['Replace farmers\' incomes entirely', 'Protect producers against climate-related losses', 'Pay donor administration fees', 'Buy stock for cooperatives'], answer: 1 },
      { q: 'Which group faces the most acute financing barriers?', options: ['Large agribusinesses', 'Government entities', 'Women and youth-led MSMEs', 'International NGOs'], answer: 2 },
    ],
  },
  {
    id: 'truepricing',
    title: 'Fundamentals of True Pricing',
    subtitle: 'Making hidden costs visible',
    category: 'True Pricing',
    icon: commodityIcon(truePricingIcon),
    duration: '1 hr',
    description: 'A complete primer on True Pricing — what it is, why it matters, the methodology, real-world cases, and how it can transform Solidaridad\'s work with farmers and supply chains.',
    lessons: [
      {
        id: 'tp-what',
        title: 'What is a True Price?',
        content: [
          { type: 'p', text: 'A market price is the classical cost of producing a product plus a profit margin — what the buyer (consumer) actually pays at the till.' },
          { type: 'callout', text: 'But more is happening that the market price does not capture. These costs are "hidden" — paid by farmers, communities, and the planet rather than the consumer.' },
          { type: 'h', text: 'Examples of hidden costs' },
          { type: 'list', items: [
            'CO₂ emissions from transport and production',
            'Land used (and sometimes degraded) to create the farm',
            'Water consumed and polluted on the farm',
            'Farmers earning less than a living income',
            'Workers exposed to unsafe conditions',
            'Communities denied a voice in resource decisions',
          ]},
          { type: 'highlight', text: 'True price = Market price + Social costs + Environmental costs.' },
          { type: 'p', text: 'The "True Price Gap" — sometimes called "what others pay for your product" — is the difference between the price on the shelf and the real cost of producing the product sustainably.' },
        ],
      },
      {
        id: 'tp-history',
        title: 'Where True Pricing Came From',
        content: [
          { type: 'p', text: 'True Pricing was developed in the Netherlands by the True Price Foundation, which has worked with companies and governments since the early 2010s to measure and reduce externalities.' },
          { type: 'list', items: [
            '2013: First true price analysis for Tony\'s Chocolonely cacao',
            '2017: Repeated analysis showing measurable improvements at Tony\'s',
            '2018-2019: IDH studies of cocoa (Ivory Coast), coffee (Vietnam), tea (Kenya), cotton (India)',
            '2020: De Aanzet in Amsterdam becomes the world\'s first true-price supermarket',
            '2022: Global Partnership for the True Price of Food established',
            '2024+: Tools and methodology being scaled across food systems globally',
          ]},
          { type: 'callout', text: 'Solidaridad and True Price share a common goal: making supply chains sustainable for farmers, workers, and the planet.' },
        ],
      },
      {
        id: 'tp-externalities',
        title: 'Social & Environmental Externalities',
        content: [
          { type: 'p', text: 'External costs fall into two categories that together form the "True Price Gap" — what others pay for your product.' },
          { type: 'h', text: 'Environmental costs' },
          { type: 'list', items: [
            'Soil pollution and soil quality loss',
            'Water pollution and scarce water use',
            'Air pollution',
            'Land use and land transformation',
            'Contribution to climate change (CO₂e emissions)',
            'Use of fossil fuels and scarce materials',
          ]},
          { type: 'h', text: 'Social costs' },
          { type: 'list', items: [
            'Underearning and underpayment of farmers and workers',
            'Gender inequality and discrimination',
            'Lack of freedom of association',
            'Health & safety failures at work',
            'Child labour and forced labour',
            'Intimidation and breach of land rights',
            'Privacy violations',
          ]},
        ],
      },
      {
        id: 'tp-goal',
        title: 'The Goal: Sustainability, Not Higher Prices',
        content: [
          { type: 'p', text: 'A common misconception: true pricing aims to make products more expensive at the checkout. It doesn\'t.' },
          { type: 'highlight', text: 'The goal is not to make things more expensive, but more sustainable.' },
          { type: 'p', text: 'True price transparency aims to reduce external costs by preventing and reducing negative environmental and social effects (externalities) in the value chain. The target is a product where social and environmental costs shrink toward zero — not a product where consumers pay more.' },
          { type: 'h', text: 'How it works in practice' },
          { type: 'list', items: [
            'Identify hidden costs through transparent methodology',
            'Trace which actor in the chain bears each cost',
            'Redesign processes to eliminate or reduce externalities',
            'Pay living wages and use clean energy at source',
            'Track the gap shrinking over time, year on year',
          ]},
          { type: 'callout', text: 'Backed by the SDGs, UN Human Rights, ILO, Paris Climate Agreement, Integrated Reporting, and the OECD.' },
        ],
      },
      {
        id: 'tp-transparency',
        title: 'Transparency Across the Chain',
        content: [
          { type: 'p', text: 'When hidden costs become visible, action becomes possible. Transparency enables every actor in the chain to play their part:' },
          { type: 'pathway', title: 'GOVERNMENTS', text: 'Adjust subsidies, taxes, and regulations — and provide businesses with incentives to internalise true pricing. EU rules like EUDR and CSDDD are direct policy responses.' },
          { type: 'pathway', title: 'BUSINESSES', text: 'Adapt operations — pay living wages, switch to cleaner energy sources, source responsibly, and redesign products. Companies like Tony\'s Chocolonely and IKEA are already publicly tracking their true price gap.' },
          { type: 'pathway', title: 'CONSUMERS', text: 'Make informed consumption choices — for example, reducing consumption of products with high externality costs, or choosing those that demonstrate progress.' },
          { type: 'pathway', title: 'FARMERS & WORKERS', text: 'Are paid fairly for the real value they create — including for the ecosystem services they steward. True price data strengthens their negotiating position.' },
          { type: 'pathway', title: 'INVESTORS', text: 'Allocate capital toward firms with low externalities and credible reduction roadmaps. ESG reporting increasingly relies on externality data.' },
        ],
      },
      {
        id: 'tp-methodology',
        title: 'The True Price Methodology',
        content: [
          { type: 'p', text: 'How is a true price actually calculated? The True Price Foundation\'s methodology has five steps:' },
          { type: 'pathway', title: 'STEP 1: SCOPE', text: 'Define the product, the value chain stages, and the externalities to include. Apply consistent boundaries.' },
          { type: 'pathway', title: 'STEP 2: MEASURE', text: 'Collect data on the negative impacts at each stage — emissions, water use, wages paid, hours worked, etc.' },
          { type: 'pathway', title: 'STEP 3: VALUE', text: 'Convert impacts into monetary terms using established cost factors (e.g. €/tCO₂e, €/m³ water, €/hour of underpayment).' },
          { type: 'pathway', title: 'STEP 4: AGGREGATE', text: 'Sum the costs per kg of product. The true price is market price + total external costs.' },
          { type: 'pathway', title: 'STEP 5: ACT', text: 'Identify the biggest costs. Design interventions. Re-measure. Track the gap closing over time.' },
          { type: 'callout', text: 'Credibility depends on transparency about assumptions — not on hiding methodology choices.' },
        ],
      },
      {
        id: 'tp-coffee-tea-cotton',
        title: 'Case: Coffee, Tea & Cotton',
        content: [
          { type: 'p', text: 'True Price analyses of commodities important to Solidaridad reveal striking external costs per kilo at the farm gate. The findings come from a 2018-2019 IDH study:' },
          { type: 'stat', number: '€7.10/kg', label: 'Cocoa (Ivory Coast)', detail: 'True price vs. conventional — including child labour and discrimination costs' },
          { type: 'stat', number: '€2.60/kg', label: 'Coffee (Vietnam)', detail: 'True price vs. conventional green beans' },
          { type: 'stat', number: '€1.05/kg', label: 'Tea (Kenya)', detail: 'Conventional green leaf tea; certified is €0.85/kg' },
          { type: 'stat', number: '€4.20/kg', label: 'Cotton (India)', detail: 'True price of seed cotton' },
          { type: 'h', text: 'Key insights' },
          { type: 'list', items: [
            'Certified production consistently reduces the true price gap',
            'The reduction comes from fewer externalities, higher yields, and higher profits',
            'Social costs (especially income) are usually the biggest contributor',
            'Climate costs are rising as carbon prices rise',
            'The hidden cost can sometimes exceed the market price itself',
          ]},
          { type: 'callout', text: 'For cocoa from Ivory Coast: the hidden cost of €7.10/kg is HIGHER than the market price of most cocoa beans paid to farmers.' },
        ],
      },
      {
        id: 'tp-tony',
        title: "Case: Tony's Chocolonely",
        content: [
          { type: 'p', text: 'Tony\'s Chocolonely, a Dutch chocolate brand, wanted to understand the impact of their cacao value chain compared to the sector — and use it to drive change.' },
          { type: 'p', text: 'In 2013 and 2017, True Price calculated the social and environmental costs of a conventional chocolate bar versus a Tony\'s bar. The results showed measurably lower true costs for Tony\'s — and the company keeps working to drive them down further year after year.' },
          { type: 'h', text: 'Tony\'s Cocoa Price Data (Côte d\'Ivoire)' },
          { type: 'list', items: [
            '2021/22: $1,458 farmgate + $362 fairtrade premium + $380 living income premium = ~$2,200 per ton',
            '2022/23: $1,344 farmgate + $551 fairtrade premium + $494 living income premium + $50 co-op fee = ~$2,390 per ton',
            'Living income premium ALONE grew by ~30% year-on-year',
          ]},
          { type: 'highlight', text: 'Tony\'s has steadily increased its premiums to cacao farmers in Côte d\'Ivoire and Ghana.' },
          { type: 'p', text: 'This is true pricing in action: identify the hidden cost (underpayment), set a target (close the gap toward a living income), and pay it. The cost is absorbed by the company and consumers — not the farmer.' },
        ],
      },
      {
        id: 'tp-deaanzet',
        title: 'Case: Supermarket De Aanzet',
        content: [
          { type: 'p', text: 'In November 2020, De Aanzet in Amsterdam became the world\'s first supermarket to display true prices alongside normal prices for everyday produce — letting consumers see the externalities in their basket.' },
          { type: 'h', text: 'Example prices shown to shoppers' },
          { type: 'list', items: [
            'Bananas (Peru): €2.79 normal · €2.94 true price (+€0.15 hidden costs)',
            'Cauliflower (Netherlands): €2.50 normal · €2.78 true price (+€0.28)',
            'Broccoli (Spain): €4.95 normal · €5.29 true price (+€0.34)',
            'Carrots (Netherlands): €1.95 normal · €2.07 true price (+€0.12)',
          ]},
          { type: 'callout', text: 'Hidden costs include underpayment, climate change, land use, and water use.' },
          { type: 'p', text: 'Consumers could choose to pay either price — the difference went into a fund that supported producer-led improvements. This experiment proved true pricing could exist in a real retail setting without scaring away shoppers.' },
        ],
      },
      {
        id: 'tp-solidaridad',
        title: 'Why It Matters for Solidaridad',
        content: [
          { type: 'p', text: 'True pricing aligns directly with Solidaridad\'s mission. When the true cost of a coffee, tea, or cocoa bean is visible, every actor in the supply chain has a basis for change.' },
          { type: 'list', items: [
            'It strengthens the case for living incomes for small-scale farmers',
            'It exposes the real cost of cheap conventional production',
            'It supports compliance with frameworks like EUDR and CSDDD',
            'It empowers Solidaridad to advocate for fairer regulation',
            'It quantifies the value of regenerative practices and PES',
            'It links our work to global partnerships like the Global Partnership for the True Price of Food',
          ]},
          { type: 'h', text: 'How Solidaridad uses true price data' },
          { type: 'list', items: [
            'In negotiations with private sector partners on premiums and sourcing terms',
            'In policy advocacy for regulations that internalise externalities',
            'In farmer training to demonstrate the real value of their stewardship',
            'In donor proposals to evidence impact beyond simple income gains',
          ]},
          { type: 'highlight', text: 'True pricing makes the invisible visible — and that is the first step to change that matters.' },
        ],
      },
      {
        id: 'tp-misconceptions',
        title: 'Common Misconceptions',
        content: [
          { type: 'p', text: 'True pricing is sometimes misunderstood. Let\'s address the most common pushbacks:' },
          { type: 'pathway', title: '"It will just raise consumer prices"', text: 'No — the goal is to reduce externalities at source. Where prices do rise modestly, the increase usually pays for clean energy or living wages, not corporate margin. And consumers can compare options and choose accordingly.' },
          { type: 'pathway', title: '"You can\'t put a number on social impact"', text: 'You can approximate it using established methods (e.g. ILO wage benchmarks, IPCC carbon cost factors). The numbers are imperfect but defensible — and they give us a basis for tracking change.' },
          { type: 'pathway', title: '"It only matters for European markets"', text: 'False. Producers benefit directly: stronger market positioning, access to climate finance, and recognition of stewardship work. Buyers in Asia, North America, and within Africa increasingly use the same framework.' },
          { type: 'pathway', title: '"Certification already does this"', text: 'Certification is a step, but it doesn\'t quantify the gap or expose what remains unaddressed. True pricing complements certification by making progress measurable.' },
        ],
      },
      {
        id: 'tp-future',
        title: 'The Future of True Pricing',
        content: [
          { type: 'p', text: 'True pricing is moving from a niche concept to a mainstream framework. Recent and upcoming shifts:' },
          { type: 'list', items: [
            'EU regulation (EUDR, CSDDD) effectively requires externality tracking',
            'Major retailers experimenting with true price labels in select stores',
            'Carbon market integration with true price calculations',
            'Living income and living wage data being built into commodity standards',
            'AI and digital tools (Solichain, MRV systems) making measurement cheaper',
            'The Global Partnership for the True Price of Food bringing >100 organizations together',
          ]},
          { type: 'callout', text: 'Solidaridad\'s role: ensure the producers who bear the cost of externalities are at the table when the future of true pricing is shaped.' },
          { type: 'highlight', text: 'A market that prices what truly matters — that is the change we are working for.' },
        ],
      },
    ],
    interactive: {
      type: 'scenario',
      title: 'True Pricing in Practice',
      scenarios: [
        {
          situation: 'A buyer tells you, "True pricing just means charging consumers more for the same product. We can\'t pass that on to our customers." How do you respond?',
          options: [
            { text: 'Agree — the higher price is unavoidable.', correct: false, feedback: 'This misses the point of true pricing entirely. The goal is not higher consumer prices.' },
            { text: 'Explain that true pricing reveals hidden costs so they can be reduced — the goal is more sustainable production, not higher retail prices.', correct: true, feedback: 'Correct. True pricing aims to shrink the gap by tackling externalities at source — paying living wages, using cleaner energy, restoring soils — not by inflating the till receipt.' },
            { text: 'Suggest they ignore the externalities and stick with the market price.', correct: false, feedback: 'This perpetuates the hidden costs paid by farmers and the environment. Solidaridad\'s mission requires the opposite.' },
          ],
        },
        {
          situation: 'A coffee cooperative in Kenya asks how true pricing could benefit them, since they are already paid above the local market rate. What\'s the strongest answer?',
          options: [
            { text: 'It won\'t help — they\'re already paid fairly.', correct: false, feedback: 'Local market rate is rarely a living income, and environmental externalities still exist regardless of price.' },
            { text: 'True pricing data can strengthen their negotiation position with buyers, attract responsible-sourcing partners, and reward their environmental stewardship through PES or premiums.', correct: true, feedback: 'Correct. True pricing creates an evidence base that supports premium positioning, regulatory compliance, and access to climate finance.' },
            { text: 'It only matters for European consumers, not African producers.', correct: false, feedback: 'Producers benefit directly — through living incomes, recognition of stewardship, and stronger market positioning.' },
          ],
        },
        {
          situation: 'A government policy team in your country asks how true pricing could inform regulation. What\'s the most useful response?',
          options: [
            { text: 'True pricing data can inform subsidy reform, environmental taxes, and incentives for businesses that internalize externalities.', correct: true, feedback: 'Correct. Governments are central to true pricing — they can shift the cost burden through tax/subsidy reform and regulation.' },
            { text: 'Governments shouldn\'t get involved in pricing.', correct: false, feedback: 'Externalities are exactly the kind of market failure that policy is designed to address.' },
            { text: 'Only consumers can drive change.', correct: false, feedback: 'Consumer choice alone isn\'t enough — system change requires aligned action from governments, businesses, and consumers.' },
          ],
        },
        {
          situation: 'A retail partner wants to display true prices in-store, like De Aanzet did. What advice supports the most credible roll-out?',
          options: [
            { text: 'Use rough estimates — close enough is fine for marketing.', correct: false, feedback: 'Inaccurate true prices undermine credibility and risk greenwashing accusations.' },
            { text: 'Apply a recognized methodology (e.g. True Price method), be transparent about assumptions, and start with a small set of priority products.', correct: true, feedback: 'Correct. Credibility requires methodology, transparency, and a defensible scope — exactly what De Aanzet did in Amsterdam.' },
            { text: 'Display only the hidden costs that look favourable.', correct: false, feedback: 'Selective disclosure is a form of greenwashing and could backfire severely.' },
          ],
        },
        {
          situation: 'A Solidaridad colleague proposes calculating a true price for our regenerative coffee programme so we can show donors the value created. What\'s the key risk to manage?',
          options: [
            { text: 'No risks — it sounds great.', correct: false, feedback: 'Every measurement framework has limitations and assumptions that need to be managed transparently.' },
            { text: 'Methodology and data quality — if assumptions aren\'t defensible or data is thin, donors may challenge the credibility of the whole programme.', correct: true, feedback: 'Correct. True pricing only adds value when applied rigorously. Get the methodology right, document assumptions, and don\'t overclaim.' },
            { text: 'It\'s too political — we should avoid the topic.', correct: false, feedback: 'True pricing is increasingly expected by donors, regulators, and partners. Avoiding it would isolate us.' },
          ],
        },
      ],
    },
    quiz: [
      { q: 'What is a true price?', options: ['Market price minus discount', 'Market price + social + environmental costs', 'Market price + VAT', 'Market price + profit margin only'], answer: 1 },
      { q: 'The goal of true pricing is to:', options: ['Make products more expensive', 'Make production more sustainable by exposing and reducing hidden costs', 'Replace market pricing', 'Increase retail margins'], answer: 1 },
      { q: 'Which is an example of a social cost?', options: ['CO₂ emissions', 'Underpayment of farmers', 'Water pollution', 'Use of fossil fuels'], answer: 1 },
      { q: 'Which is an example of an environmental cost?', options: ['Child labour', 'Soil pollution', 'Underpayment', 'Discrimination'], answer: 1 },
      { q: 'According to True Price analyses, which has the largest true price gap per kg?', options: ['Cocoa from Ivory Coast', 'Tea from Kenya', 'Coffee from Vietnam', 'Cotton from India'], answer: 0 },
      { q: 'Tony\'s Chocolonely uses true pricing to:', options: ['Charge consumers more', 'Increase premiums to cacao farmers in Côte d\'Ivoire and Ghana', 'Stop buying cocoa', 'Avoid certification'], answer: 1 },
      { q: 'Which Amsterdam supermarket displayed true prices for consumers in 2020?', options: ['Albert Heijn', 'De Aanzet', 'Jumbo', 'Lidl'], answer: 1 },
      { q: 'Who benefits when hidden costs become transparent?', options: ['Only consumers', 'Only governments', 'Governments, businesses, consumers, farmers and workers — across the chain', 'Only retailers'], answer: 2 },
      { q: 'True pricing is supported by which global frameworks?', options: ['SDGs, UN Human Rights, ILO, Paris Agreement, OECD', 'Just the EU', 'Only Dutch national policy', 'No international frameworks'], answer: 0 },
      { q: 'Certified production generally:', options: ['Increases the true price gap', 'Reduces the true price gap through fewer externalities', 'Has no effect on true price', 'Only affects retail price'], answer: 1 },
      { q: 'How many steps are in the True Price methodology?', options: ['Three', 'Four', 'Five', 'Seven'], answer: 2 },
      { q: 'For cocoa from Ivory Coast, the hidden cost is:', options: ['Negligible', 'Less than the farmgate price', 'Higher than the market price farmers receive', 'Always paid by the consumer'], answer: 2 },
      { q: 'EU regulations relevant to true pricing include:', options: ['Just GDPR', 'EUDR and CSDDD', 'Only health & safety rules', 'No EU regulations'], answer: 1 },
      { q: 'What did Tony\'s living income premium do between 2021/22 and 2022/23?', options: ['Decreased', 'Stayed flat', 'Grew by ~30%', 'Was eliminated'], answer: 2 },
      { q: 'The Global Partnership for the True Price of Food brings together:', options: ['Just two organizations', '10 organizations', '>100 organizations', 'Only governments'], answer: 2 },
    ],
  },
  {
    id: 'brand',
    title: 'Communications & Branding',
    subtitle: 'Representing Solidaridad',
    category: 'Communications',
    icon: commodityIcon(brandIconSrc),
    duration: '15 min',
    description: 'Master logo usage, colours, typography, email etiquette, and Solidaridad\'s UN English writing style.',
    lessons: [
      {
        id: 'logo',
        title: 'Name & Logo',
        content: [
          { type: 'p', text: 'Our name is Solidaridad. We don\'t add country or regional names unless distinguishing ourselves is needed.' },
          { type: 'p', text: 'Our logo is black with a yellow swoosh — also available in white with a yellow swoosh for dark backgrounds.' },
          { type: 'callout', text: 'The logo may NEVER be altered, stretched or compacted. Always leave white space around it to breathe.' },
          { type: 'highlight', text: 'Pay off: CHANGE THAT MATTERS — never translate it.' },
        ],
      },
      {
        id: 'colour',
        title: 'Colour Palette',
        content: [
          { type: 'p', text: 'Solidaridad is easily identified through its signature yellow.' },
          { type: 'colour', name: 'YELLOW', hex: '#FFC800', code: 'PMS 123C' },
          { type: 'colour', name: 'BLACK', hex: '#000000', code: 'PMS Black' },
          { type: 'colour', name: 'GREY', hex: '#D9D9C3', code: 'PMS 7527C' },
        ],
      },
      {
        id: 'typography',
        title: 'Typography',
        content: [
          { type: 'p', text: 'Open Sans is our standard font for all communication.' },
          { type: 'list', items: [
            'Headings: Open Sans Extra Bold UPPERCASE',
            'Intros & quotes: Open Sans Light',
            'Body text: Open Sans Regular',
          ]},
        ],
      },
      {
        id: 'writing',
        title: 'UN English Style',
        content: [
          { type: 'p', text: 'Solidaridad uses international English based on the UN style guide and Oxford Dictionary.' },
          { type: 'list', items: [
            'organization, globalization (with -z-)',
            'programme, centre, fibre, colour, labour',
            'analyse, paralyse (with -s-)',
            'travelling, fuelled (double -l-)',
          ]},
          { type: 'callout', text: 'Write in active voice. Short sentences (15-20 words). Avoid jargon and acronyms.' },
        ],
      },
    ],
    interactive: {
      type: 'spelling-sort',
      title: 'UN English vs. American Spelling',
      pairs: [
        { correct: 'organization', incorrect: 'organisation' },
        { correct: 'programme', incorrect: 'program' },
        { correct: 'centre', incorrect: 'center' },
        { correct: 'colour', incorrect: 'color' },
        { correct: 'analyse', incorrect: 'analyze' },
        { correct: 'travelling', incorrect: 'traveling' },
        { correct: 'dialogue', incorrect: 'dialog' },
        { correct: 'labour', incorrect: 'labor' },
      ],
    },
    quiz: [
      { q: 'What is the correct hex code for Solidaridad yellow?', options: ['#FFD700', '#FFC800', '#FFAA00', '#F4C430'], answer: 1 },
      { q: 'What font do we use as our standard?', options: ['Helvetica', 'Arial', 'Open Sans', 'Roboto'], answer: 2 },
      { q: 'Which spelling is correct per our style guide?', options: ['Organize', 'Organise', 'Organization', 'Organizn'], answer: 2 },
      { q: 'What is the maximum recommended sentence length?', options: ['5-10 words', '15-20 words', '25-30 words', '40+ words'], answer: 1 },
      { q: 'Our pay-off "Change That Matters" should be:', options: ['Always translated locally', 'Used when relevant, never translated', 'Used everywhere', 'Only in English-speaking countries'], answer: 1 },
      { q: 'Which colour palette is correct?', options: ['Yellow, Black, Warm Grey', 'Green, White, Black', 'Yellow, Blue, White', 'Orange, Black, Grey'], answer: 0 },
      { q: 'Headings should be:', options: ['Open Sans Extra Bold UPPERCASE', 'Open Sans Light lowercase', 'Italic regular', 'Times New Roman bold'], answer: 0 },
      { q: 'Which spelling follows our UN English standard?', options: ['Center', 'Centre', 'Sentre', 'Centerr'], answer: 1 },
      { q: 'In writing, we prefer:', options: ['Passive voice and long sentences', 'Active voice and short sentences', 'Heavy jargon', 'Many acronyms'], answer: 1 },
      { q: 'Which is the correct UN English spelling?', options: ['Analyze', 'Analyse', 'Analize', 'Anelyse'], answer: 1 },
    ],
  },
  {
    id: 'digital',
    title: 'Digital Solutions',
    subtitle: 'Tech for transformation',
    category: 'Digital',
    icon: commodityIcon(digitalIcon),
    duration: '15 min',
    description: 'Explore the digital ecosystem powering Solidaridad — from Solichain blockchain traceability to J\'Funze e-learning and Uwanjani field data.',
    lessons: [
      {
        id: 'digital-overview',
        title: 'Why Digital Matters',
        content: [
          { type: 'p', text: 'Robust digital infrastructure is central to systems transformation. Solidaridad expands its digital ecosystem to drive efficiency, inclusion, and learning across agriculture, industry, and mining.' },
          { type: 'callout', text: 'In partnership with Microsoft, Google, and ESRI, we deploy AI, IoT, and climate intelligence systems.' },
        ],
      },
      {
        id: 'solichain',
        title: 'Solichain — Blockchain Traceability',
        content: [
          { type: 'p', text: 'Solichain is our blockchain-based traceability platform — configurable to support multiple value chains.' },
          { type: 'list', items: [
            'Monitors farm-level practices',
            'Supports certification and regulatory compliance (EUDR, CSDDD)',
            'Ensures transparent product journeys from farm to consumer',
            'Tamper-proof records of sustainability claims',
          ]},
        ],
      },
      {
        id: 'tools-suite',
        title: 'Our Digital Suite',
        content: [
          { type: 'pathway', title: 'J\'FUNZE', text: 'Self-paced e-learning for farmers, lead farmers, and staff.' },
          { type: 'pathway', title: 'CARBON ACADEMY', text: 'Capacity-building on carbon farming and climate markets.' },
          { type: 'pathway', title: 'E-DAIRY', text: 'Quality-based milk payment applications.' },
          { type: 'pathway', title: 'UWANJANI', text: 'Enterprise field data management system.' },
          { type: 'pathway', title: 'ZWARDY', text: 'Reward system incentivizing sustainable practices and training.' },
          { type: 'pathway', title: 'MRV DASHBOARD', text: 'Greenhouse gas monitoring, reporting, and verification.' },
        ],
      },
      {
        id: 'data-governance',
        title: 'Data Governance & Privacy',
        content: [
          { type: 'p', text: 'Throughout, Solidaridad upholds strong data governance principles:' },
          { type: 'list', items: [
            'Privacy by design',
            'Informed consent from data subjects',
            'Ethical data reuse',
            'Compliance with data privacy standards',
            'Investment in cybersecurity',
            'Co-design with stakeholders',
          ]},
        ],
      },
    ],
    interactive: {
      type: 'match-value',
      title: 'Match the Digital Tool to its Purpose',
      pairs: [
        { value: 'SOLICHAIN', behaviour: 'Tracking a coffee bag from farm to roaster with tamper-proof records.' },
        { value: 'J\'FUNZE', behaviour: 'Offering self-paced e-learning modules to staff and farmers.' },
        { value: 'E-DAIRY', behaviour: 'Calculating milk payments based on quality grading.' },
        { value: 'UWANJANI', behaviour: 'Collecting field data from extension officers in real time.' },
        { value: 'ZWARDY', behaviour: 'Rewarding farmers for completing trainings and adopting practices.' },
      ],
    },
    quiz: [
      { q: 'What is Solichain?', options: ['A coffee variety', 'A blockchain traceability platform', 'A solar product', 'A mining tool'], answer: 1 },
      { q: 'Which platform supports self-paced e-learning?', options: ['Solichain', 'J\'Funze', 'Uwanjani', 'E-Dairy'], answer: 1 },
      { q: 'Solidaridad partners with which tech firms for digital tools?', options: ['Just Microsoft', 'Microsoft, Google, ESRI', 'Apple only', 'Meta and Amazon'], answer: 1 },
      { q: 'What does MRV stand for in our climate work?', options: ['Multi-Regional Variation', 'Monitoring, Reporting, Verification', 'Major Risk Vector', 'Maximum Resource Value'], answer: 1 },
      { q: 'Uwanjani is used for:', options: ['Payroll', 'Field data management', 'Social media', 'Booking flights'], answer: 1 },
      { q: 'What is E-Dairy used for?', options: ['Online shopping', 'Quality-based milk payments', 'Currency exchange', 'Vehicle tracking'], answer: 1 },
      { q: 'Zwardy is a system that:', options: ['Tracks deliveries', 'Rewards sustainable practices and training', 'Pays salaries', 'Manages emails'], answer: 1 },
      { q: 'Solichain supports compliance with which regulation?', options: ['GDPR only', 'EUDR and CSDDD', 'CITES', 'WTO'], answer: 1 },
      { q: 'Solidaridad upholds which key data principle?', options: ['Open data with no restrictions', 'Privacy, consent, and ethical reuse', 'Data hoarding', 'No data collection at all'], answer: 1 },
      { q: 'Carbon Academy provides:', options: ['Carbon credits for sale', 'Capacity-building on carbon farming and climate markets', 'A trading floor', 'Stock market analysis'], answer: 1 },
    ],
  },
  {
    id: 'pmel',
    title: 'Planning, Monitoring, Evaluation & Learning (PMEL)',
    subtitle: 'Evidence-based decision making',
    category: 'PMEL',
    icon: commodityIcon(pmelIcon),
    duration: '20 min',
    description: 'Learn how Solidaridad uses data, indicators, and adaptive management to drive evidence-based decisions across MASP IV.',
    lessons: [
      {
        id: 'pmel-overview',
        title: 'Why PMEL?',
        content: [
          { type: 'p', text: 'Under MASP IV, PMEL enables evidence-based decision-making, adaptive management, and learning. It is anchored in a regional results framework aligned with the Theory of Change.' },
          { type: 'callout', text: 'We track progress from outputs to outcomes to impact — using both quantitative and qualitative KPIs.' },
        ],
      },
      {
        id: 'data-solutions',
        title: 'Data Solutions',
        content: [
          { type: 'p', text: 'Our data ecosystem combines several platforms:' },
          { type: 'list', items: [
            'Uwanjani — regional field data collection',
            'Plaza — network-level project management (Salesforce)',
            'KoboToolbox — survey-based data collection',
            'Looker Studio, Zoho, Tableau, Power BI — analytics and dashboards',
            'Standardized indicators aligned with regional and global KPIs',
          ]},
        ],
      },
      {
        id: 'planning-cycle',
        title: 'Annual Planning Cycle',
        content: [
          { type: 'pathway', title: 'Q4 PLANNING', text: 'Annual planning done in the last quarter of every year to guide KPI target setting.' },
          { type: 'pathway', title: 'Q1 REPORTING', text: 'Annual performance reporting done in the first quarter of every year.' },
          { type: 'pathway', title: 'QUARTERLY MONITORING', text: 'Monthly, quarterly, and biannual reports produced to track progress.' },
          { type: 'pathway', title: 'EVALUATION', text: 'Baseline, midterm, and final studies using mixed methods including quasi-experimental designs.' },
        ],
      },
      {
        id: 'kpis',
        title: 'Key Performance Indicators',
        content: [
          { type: 'p', text: 'Strategic Results Framework KPIs by 2030:' },
          { type: 'stat', number: '649,000', label: 'Farmers with improved farm viability', detail: '80% of 811,250 targeted' },
          { type: 'stat', number: '1,298,000', label: 'tCO₂e/year sequestered or avoided', detail: 'Average 2 tCO₂eq per farmer' },
          { type: 'stat', number: '37,500', label: 'New decent green jobs', detail: '80% inclusive and sustainable' },
          { type: 'stat', number: '56', label: 'Regulations and frameworks improved', detail: 'Across the four ECA countries' },
        ],
      },
      {
        id: 'learning',
        title: 'Strategic Learning',
        content: [
          { type: 'p', text: 'Learning is embedded throughout program design and implementation to drive continuous improvement.' },
          { type: 'list', items: [
            'Communities of practice',
            'Webinars and learning labs',
            'Cross-country peer exchanges',
            'Publications and case studies',
            'Adaptive management based on real-time insights',
          ]},
        ],
      },
    ],
    interactive: {
      type: 'spelling-sort',
      title: 'Quantitative or Qualitative?',
      pairs: [
        { correct: 'Number of farmers trained', incorrect: 'Farmer satisfaction story' },
        { correct: 'Hectares under regenerative practice', incorrect: 'Beneficiary case study' },
        { correct: 'Tonnes of CO₂e sequestered', incorrect: 'Community testimonial' },
        { correct: '% of women in leadership roles', incorrect: 'Lived experience narrative' },
        { correct: 'Number of policies adopted', incorrect: 'Stakeholder reflection' },
      ],
    },
    quiz: [
      { q: 'When is annual performance reporting done?', options: ['Q1', 'Q2', 'Q3', 'Q4'], answer: 0 },
      { q: 'Which is the network-level project management platform?', options: ['Uwanjani', 'Plaza (Salesforce)', 'KoboToolbox', 'Solichain'], answer: 1 },
      { q: 'Why do we primarily rely on quantitative KPIs?', options: ['Easier to spell', 'Consistent and objective evaluation', 'Required by Dutch law', 'No reason'], answer: 1 },
      { q: 'How many farmers will have improved farm viability by 2030?', options: ['100,000', '500,000', '649,000', '1 million'], answer: 2 },
      { q: 'What does PMEL stand for?', options: ['Planning, Monitoring, Evaluation, Learning', 'Project Management Engineering Lab', 'Producer Marketing & Education Logistics', 'Policy, Markets, Environment, Livelihoods'], answer: 0 },
      { q: 'When is annual planning done?', options: ['Q1', 'Q2', 'Q3', 'Q4 (last quarter)'], answer: 3 },
      { q: 'Which tool is used for regional field data collection?', options: ['Plaza', 'Uwanjani', 'Power BI', 'Slack'], answer: 1 },
      { q: 'Evaluation methods include:', options: ['Only surveys', 'Mixed methods including quasi-experimental designs', 'Just interviews', 'Random guessing'], answer: 1 },
      { q: 'PMEL is anchored in:', options: ['Donor preference', 'A regional results framework aligned with Theory of Change', 'Personal opinions', 'External rankings'], answer: 1 },
      { q: 'Which analytics platforms does Solidaridad use?', options: ['Excel only', 'Looker Studio, Zoho, Tableau, Power BI', 'Pen and paper', 'Instagram'], answer: 1 },
    ],
  }
);



COURSES.push({
  id: 'gender',
  title: 'Gender, Equality & Inclusion',
  subtitle: 'Inclusive programming the Solidaridad way',
  category: 'Gender',
  icon: commodityIcon(genderIcon),
  duration: '1 hr 20 min',
  description: 'A comprehensive gender course built on Solidaridad\'s Gender Task Force materials and the KAYA learning journey. Covers four modules — Gender Basics, Gender Analysis, Gender Responsive Programming, and Sustainability & Inclusivity — adapted for ECA staff at all levels.',
  lessons: [
    {
      id: 'gender-why',
      title: 'Why Gender Matters at Solidaridad',
      content: [
        { type: 'p', text: 'Gender shapes every aspect of how our supply chains work — who farms, who decides, who profits, and who gets left behind. For Solidaridad, gender equality is not a side project. It is core to delivering change that matters.' },
        { type: 'h', text: 'Our Gender Journey' },
        { type: 'p', text: 'In 2017, Solidaridad adopted a global Gender Policy. The Gender Task Force, set up to drive implementation, built a learning curriculum on the KAYA Humanitarian Leadership Academy platform — piloted across regions in West Africa, Asia, Latin America, and Southern Africa before being launched globally in 2020.' },
        { type: 'pathway', title: '2017-2018: LEARNING RESEARCH', text: 'A network-wide gender learning needs assessment — what staff learn, how they learn, which moments they learn — produced our User Research Report.' },
        { type: 'pathway', title: '2018: CONTENT DEVELOPMENT', text: 'First modules developed and tested in West Africa, Indonesia, Bhopal, Colombia, and Honduras.' },
        { type: 'pathway', title: '2019-2020: NETWORK ROLL-OUT', text: 'Revised hard copies tested in Southern Africa; e-learning course launched on KAYA with four modules.' },
        { type: 'pathway', title: '2021 ONWARDS: ECA ROLL-OUT', text: 'Coordinated by the ECA Gender Inclusivity Advisor — Tanzania (Jan-Feb), Uganda (Feb-Mar), Kenya & Ethiopia (Mar-Apr), with the first cohort graduating in July-August 2021.' },
        { type: 'highlight', text: 'This course is the Solidaridad gender curriculum — adapted for ECA, hosted on Jifunze.' },
        { type: 'h', text: 'What you\'ll learn' },
        { type: 'list', items: [
          'Module 1 — Gender Basics: foundational concepts',
          'Module 2 — Gender Analysis: tools for understanding power dynamics',
          'Module 3 — Gender Responsive Programming: GALS, EMAP, EA$E, SASA!, Gender Smart Villages',
          'Module 4 — Sustainability & Inclusivity: making change last, beyond gender',
        ]},
        { type: 'callout', text: 'This course is designed for staff at all levels — field officers and lead farmers, programme managers, and senior leadership. Take what fits your role and stretch where you can.' },
      ],
    },
    {
      id: 'gender-foundations',
      title: 'Sex, Gender & Identity',
      content: [
        { type: 'p', text: 'Before we can analyse gender dynamics in our work, we need a shared vocabulary. The first step is distinguishing sex from gender.' },
        { type: 'h', text: 'Sex' },
        { type: 'p', text: 'Sex refers to the biological characteristics — chromosomes, hormones, reproductive anatomy — that classify someone as female, male, or intersex. Sex is largely universal across cultures, though biology itself is more variable than binary categories suggest.' },
        { type: 'h', text: 'Gender' },
        { type: 'p', text: 'Gender refers to the socially constructed roles, behaviours, expressions, and identities that a society assigns to people based on their sex. Unlike sex, gender varies dramatically across cultures, time periods, and contexts — and it can change.' },
        { type: 'callout', text: 'Sex is what you are born with. Gender is what your society teaches you to be.' },
        { type: 'h', text: 'Why the distinction matters' },
        { type: 'list', items: [
          'Sex differences (e.g. who can give birth) are biological and largely fixed',
          'Gender roles (e.g. who fetches water, who chairs meetings) are social — and they can change',
          'Many "natural" differences are actually social — gender norms, not biology',
          'Recognising this gives us leverage: norms that were made can be unmade',
        ]},
        { type: 'h', text: 'Beyond binary' },
        { type: 'p', text: 'In many contexts — including parts of East and Central Africa — gender identities extend beyond the male/female binary. Solidaridad respects diverse gender identities and works to ensure everyone we serve is included, regardless of how they identify.' },
        { type: 'highlight', text: 'Gender is socially constructed — which means it can be socially transformed.' },
      ],
    },
    {
      id: 'gender-concepts',
      title: 'Equality, Equity & Mainstreaming',
      content: [
        { type: 'p', text: 'A few terms get used interchangeably in gender work — usually incorrectly. Getting them right is the difference between an intervention that lands and one that drifts.' },
        { type: 'h', text: 'Gender Equality' },
        { type: 'p', text: 'Equality means women, men, girls, boys, and people of all gender identities have the same rights, opportunities, and responsibilities. It is the destination.' },
        { type: 'h', text: 'Gender Equity' },
        { type: 'p', text: 'Equity recognises that people start from different positions — different access to resources, different burdens, different histories. Equity means giving people what they need to reach equal outcomes. It is the journey.' },
        { type: 'callout', text: 'Equality treats everyone the same. Equity treats everyone as they need to be treated to reach the same outcome. Equity is how we get to equality.' },
        { type: 'h', text: 'Gender Mainstreaming' },
        { type: 'p', text: 'Mainstreaming is the process of embedding gender considerations into every stage of policy, programme, and project work — design, implementation, monitoring, evaluation — rather than treating gender as a separate add-on.' },
        { type: 'h', text: 'A spectrum of approaches' },
        { type: 'p', text: 'Programmes can sit anywhere on a spectrum from harmful to transformative:' },
        { type: 'pathway', title: 'GENDER-BLIND', text: 'Ignores gender entirely — assumes "farmers" are gender-neutral. Often perpetuates existing inequalities by default.' },
        { type: 'pathway', title: 'GENDER-AWARE', text: 'Notices that gender exists and disaggregates data, but takes no action to address inequalities.' },
        { type: 'pathway', title: 'GENDER-SENSITIVE', text: 'Adapts activities so women can participate (e.g. shorter trainings during harvest), but does not challenge underlying power dynamics.' },
        { type: 'pathway', title: 'GENDER-RESPONSIVE', text: 'Actively addresses gender gaps — targets women, provides childcare, designs around their needs.' },
        { type: 'pathway', title: 'GENDER-TRANSFORMATIVE', text: 'Challenges and changes the underlying norms, roles, and power structures that create inequality in the first place. This is where Solidaridad aims to be.' },
        { type: 'highlight', text: 'Aim for gender-transformative. Anything less leaves the system intact.' },
      ],
    },
    {
      id: 'gender-eca',
      title: 'Gender in ECA Value Chains',
      content: [
        { type: 'p', text: 'Gender dynamics play out differently in every value chain. In ECA, women perform an enormous share of agricultural labour — yet own little land, access little finance, and rarely sit on cooperative boards. Understanding the specifics of each sector is the foundation of effective programming.' },
        { type: 'h', text: 'The headline numbers' },
        { type: 'stat', number: '60-80%', label: 'Women\'s share of agricultural labour', detail: 'In sub-Saharan Africa, women provide the majority of farm labour' },
        { type: 'stat', number: '<20%', label: 'Land formally owned by women', detail: 'Across most ECA countries, despite their labour share' },
        { type: 'stat', number: '19%', label: 'Pay gap', detail: 'Women in ECA earn 19% less than men for comparable work' },
        { type: 'stat', number: '41%', label: 'Women in secondary education', detail: 'Limiting access to skilled work and leadership' },
        { type: 'h', text: 'Sector-specific dynamics' },
        { type: 'pathway', title: 'COFFEE & TEA', text: 'Women dominate picking and sorting but rarely receive the payment — coffee/tea income often goes to the male household head. Cooperative membership and bank accounts are typically in men\'s names.' },
        { type: 'pathway', title: 'DAIRY (LIVESTOCK)', text: 'Women manage day-to-day cow care — feeding, milking, calf rearing — while men handle sale and finance. Quality-based payment systems (e-Dairy) can shift income visibility toward women.' },
        { type: 'pathway', title: 'COTTON & FASHION', text: 'In Ethiopia\'s textile sector, women dominate factory floor work but face safety, wage, and harassment concerns. Cotton farming is mixed — women in field labour, men in marketing.' },
        { type: 'pathway', title: 'GOLD (ASM)', text: 'Artisanal mining is male-dominated underground but women dominate processing and trading roles. Mercury exposure and child-care burden hit women hardest.' },
        { type: 'pathway', title: 'FRUITS & VEGETABLES, SPICES', text: 'Women dominate kitchen gardens and small-scale horticulture. As crops commercialise, control often shifts to men. Spice value chains in Uganda show how a "women\'s crop" can be lost.' },
        { type: 'callout', text: 'The pattern is consistent: where women\'s work meets cash, control often shifts. Effective gender programming spots this transition point — and protects women\'s position through it.' },
        { type: 'highlight', text: 'Know your sector. The gender dynamics in coffee are not the dynamics in gold.' },
      ],
    },
    {
      id: 'gender-analysis-what',
      title: 'What is Gender Analysis?',
      content: [
        { type: 'p', text: 'Gender analysis is a structured way of examining the differences between women, men, girls, boys, and other gender identities — their roles, their access to resources, their decision-making power, and how a proposed or existing programme will affect them.' },
        { type: 'h', text: 'What gender analysis answers' },
        { type: 'list', items: [
          'Who does what? (division of labour)',
          'Who has access to what resources? (land, credit, training, tools)',
          'Who controls what resources? (income, decisions, assets)',
          'Who benefits and who loses from a proposed intervention?',
          'What gender norms shape these patterns — and where are they shifting?',
        ]},
        { type: 'h', text: 'Beyond counting women' },
        { type: 'p', text: 'Counting how many women attend a training is not gender analysis. Real analysis examines who is in the room, who is missing, who speaks, who decides, and who benefits — and asks why.' },
        { type: 'callout', text: 'If your "gender analysis" is just a table of how many women you trained, it isn\'t one. Counting is the start, not the finish.' },
        { type: 'h', text: 'When to conduct gender analysis' },
        { type: 'pathway', title: 'DESIGN', text: 'Before the programme begins — to shape its logic, indicators, and approach. The most important moment.' },
        { type: 'pathway', title: 'MID-IMPLEMENTATION', text: 'When something isn\'t working as expected — to diagnose whether gender dynamics are part of the problem.' },
        { type: 'pathway', title: 'EVALUATION', text: 'At the end — to understand the differential impacts on women, men, youth, and other groups.' },
        { type: 'h', text: 'Sex-disaggregated data' },
        { type: 'p', text: 'Every indicator we track should be disaggregated by sex (and ideally by age and other markers of inequality). Without this, "average results" hide the real story. A programme that benefits men twice as much as women can look like a success — until the data is split.' },
        { type: 'highlight', text: 'Disaggregate everything. Aggregate numbers hide the gender story.' },
      ],
    },
    {
      id: 'gender-analysis-frameworks',
      title: 'Frameworks for Gender Analysis',
      content: [
        { type: 'p', text: 'Several established frameworks give structure to gender analysis. You don\'t need to use them all — picking the right one for the question matters more than completeness.' },
        { type: 'value', title: 'HARVARD ANALYTICAL FRAMEWORK', text: 'Maps the activity profile (who does what), access profile (who has access to resources), and control profile (who decides). Best for project design and clear, simple gender mapping.' },
        { type: 'value', title: 'MOSER FRAMEWORK', text: 'Distinguishes practical gender needs (immediate, e.g. easier water access) from strategic gender needs (long-term, e.g. women on the cooperative board). Best for choosing between short-term wins and long-term change.' },
        { type: 'value', title: 'SOCIAL RELATIONS FRAMEWORK', text: 'Analyses gender in the context of all social relationships — household, community, state, market. Best for complex programmes where gender intersects with class, ethnicity, or age.' },
        { type: 'value', title: 'GALS', text: 'Gender Action Learning System. A participatory methodology where farmers map their own gender dynamics and design their own change pathways. Best for community-led programmes — covered in depth in a later lesson.' },
        { type: 'h', text: 'Practical vs strategic — Moser in detail' },
        { type: 'p', text: 'Moser\'s distinction is one of the most useful in gender programming:' },
        { type: 'list', items: [
          'PRACTICAL GENDER NEEDS — make existing gender roles easier (e.g. fuel-efficient stoves so women spend less time gathering wood)',
          'STRATEGIC GENDER NEEDS — change underlying power structures (e.g. women joining the cooperative board, women holding land titles)',
        ]},
        { type: 'callout', text: 'Practical needs win trust quickly. Strategic needs change the system. Good programmes do both — strategically.' },
        { type: 'h', text: 'Which framework when?' },
        { type: 'list', items: [
          'Designing a new project? Start with Harvard — clear, fast, defensible',
          'Stuck between short-term and long-term goals? Use Moser to separate them',
          'Working in a complex context with multiple inequalities? Social Relations',
          'Want farmers to lead their own analysis? GALS',
        ]},
      ],
    },
    {
      id: 'gender-spectrum',
      title: 'From Gender-Blind to Gender-Transformative',
      content: [
        { type: 'p', text: 'The same activity can sit anywhere on the gender spectrum, depending on how it\'s designed. Take "training farmers in coffee agronomy" — here it is at each level:' },
        { type: 'pathway', title: 'GENDER-BLIND', text: 'Train "farmers" without thinking about who attends. Most participants are men — because the time, location, and topic fit men\'s lives. Outcome: men gain skills, women are excluded.' },
        { type: 'pathway', title: 'GENDER-AWARE', text: 'Notice that only 20% of trainees are women. Report it. Take no further action. Outcome: same as gender-blind, but documented.' },
        { type: 'pathway', title: 'GENDER-SENSITIVE', text: 'Move the training time to after lunch (when women have finished cooking) and add childcare. Outcome: 50% of trainees are women. Skills built.' },
        { type: 'pathway', title: 'GENDER-RESPONSIVE', text: 'Design separate sessions for women to ensure they speak up; include topics relevant to their roles (post-harvest, kitchen gardens, household nutrition). Outcome: real skill uptake by women.' },
        { type: 'pathway', title: 'GENDER-TRANSFORMATIVE', text: 'Also work with men — through EMAP or community dialogues — to recognise women\'s contribution and share decision-making. Engage cooperatives to add women to the board. Outcome: norms shift, power redistributes.' },
        { type: 'highlight', text: 'Gender-transformative work isn\'t harder — it just goes further upstream.' },
        { type: 'h', text: 'Why settle for less?' },
        { type: 'p', text: 'Many programmes claim to be gender-responsive while actually being gender-sensitive at best. The reasons are familiar — time, budget, donor expectations, fear of pushback from male community members. None of these are good enough reasons for Solidaridad.' },
        { type: 'callout', text: 'A gender-sensitive programme leaves the system intact. A gender-transformative programme changes it. Solidaridad\'s mission requires the second.' },
      ],
    },
    {
      id: 'gender-gals',
      title: 'GALS — Gender Action Learning System',
      content: [
        { type: 'p', text: 'GALS is one of the most powerful gender methodologies in our toolkit. Developed by Linda Mayoux and refined through field application across Africa, Asia, and Latin America, GALS puts farmers in charge of analysing and changing their own gender dynamics.' },
        { type: 'h', text: 'Core principles' },
        { type: 'list', items: [
          'Farmers (not consultants) do the analysis',
          'Pictorial tools — works regardless of literacy',
          'Both women and men participate from the start',
          'Visions for the household become a shared project',
          'Change is tracked over time by the participants themselves',
        ]},
        { type: 'h', text: 'Key GALS tools' },
        { type: 'value', title: 'VISION JOURNEY', text: 'Each participant draws a vision of their ideal life in 5-10 years — household, finances, family. They then map the milestones and obstacles between today and that vision. The household vision becomes a planning tool both partners commit to.' },
        { type: 'value', title: 'GENDER BALANCE TREE', text: 'A drawing of a tree representing the household. Roots show contributions (labour, time, money) by each partner. Branches show benefits received. The asymmetry — usually women\'s heavy roots, men\'s heavy branches — becomes immediately visible. Couples then agree on rebalancing.' },
        { type: 'value', title: 'MULTILANE HIGHWAY', text: 'A map of lanes representing different goals (income, education, household harmony). Participants identify where they are on each lane and what blocks progress — including gender norms. Used to plan concrete next steps.' },
        { type: 'value', title: 'CHALLENGE ACTION TREE', text: 'Maps challenges at the roots, with action branches above. Used to design specific interventions to overcome identified barriers.' },
        { type: 'h', text: 'Why GALS works' },
        { type: 'p', text: 'Standard gender trainings can feel like outsiders telling communities they are doing things wrong. GALS turns it around — the community itself names the problem and designs the solution. The result is durable because it\'s owned.' },
        { type: 'callout', text: 'In Solidaridad ECA programmes, GALS has been adapted into Farmer Field Schools, lead farmer training, and cooperative governance work. It is one of our most-used methodologies.' },
        { type: 'highlight', text: 'When farmers draw their own gender map, the map becomes their plan.' },
      ],
    },
    {
      id: 'gender-methodologies',
      title: 'EMAP, EA$E & SASA! — More Tools in the Kit',
      content: [
        { type: 'p', text: 'GALS is foundational but it isn\'t the only tool. Three other methodologies feature in Solidaridad\'s GESI work — each suited to a different challenge.' },
        { type: 'value', title: 'EMAP', text: 'Engaging Men in Accountable Practices. A series of structured group sessions for men, exploring masculinities, power, and the harm caused by inequitable practices. Used when male resistance is a primary obstacle to women\'s empowerment — and when the goal is to bring men in as allies, not adversaries.' },
        { type: 'value', title: 'EA$E', text: 'Economic and Social Empowerment. Combines village savings & loan groups with structured discussions on gender and household decision-making. Used when financial inclusion is the entry point — savings groups are a venue for both wealth-building and norm change.' },
        { type: 'value', title: 'SASA!', text: 'Start, Awareness, Support, Action — a community mobilisation approach focused on preventing violence against women. Used in contexts where gender-based violence is a barrier to programme success. Developed by Raising Voices in Uganda.' },
        { type: 'h', text: 'When to use what' },
        { type: 'pathway', title: 'EMAP — for resistance', text: 'Use when men\'s opposition or scepticism is the main blocker. Best results come from cohorts of 10-15 men meeting weekly over several months.' },
        { type: 'pathway', title: 'EA$E — for finance + norms', text: 'Use when you have a savings group or VSLA already in place. The financial activity gives a reason to meet; the structured discussions do the rest.' },
        { type: 'pathway', title: 'SASA! — for safety + change', text: 'Use in contexts where violence is a real barrier. Requires trained facilitators and longer programme cycles (12-18 months minimum).' },
        { type: 'callout', text: 'These methodologies are rarely used alone. A typical Solidaridad programme might combine GALS for household-level change, EMAP for engaging male partners, and EA$E for the financial dimension.' },
      ],
    },
    {
      id: 'gender-villages',
      title: 'Gender Smart Villages & Farmer Field Schools',
      content: [
        { type: 'p', text: 'Methodologies like GALS, EMAP, and EA$E are most powerful when integrated into the structures Solidaridad already runs in communities — Farmer Field Schools, lead farmer networks, and the Gender Smart Village model.' },
        { type: 'h', text: 'Farmer Field Schools (FFS)' },
        { type: 'p', text: 'FFS bring 25-30 farmers together over a full season for hands-on agronomic learning. Adding a gender dimension means:' },
        { type: 'list', items: [
          'Gender balance in enrolment — actively recruit women, not just accept who comes',
          'Time and location set so women can attend (avoid harvest peaks, midday)',
          'Gender champions identified within each FFS — often a woman and a man pair',
          'GALS sessions integrated into the curriculum, not bolted on',
          'Childcare available — practical needs come first',
        ]},
        { type: 'h', text: 'Gender Smart Villages' },
        { type: 'p', text: 'The Gender Smart Village model goes one step further — it treats the whole village (not just FFS participants) as the unit of change. Components include:' },
        { type: 'pathway', title: 'GENDER CHAMPIONS', text: 'Trained women and men who model and advocate for change. Selected by the community, accountable to it.' },
        { type: 'pathway', title: 'COMMUNITY DIALOGUES', text: 'Regular gatherings where gender norms are openly discussed. SASA! and GALS provide structure.' },
        { type: 'pathway', title: 'LEADERSHIP PIPELINE', text: 'Active mentoring of women into cooperative leadership, lead farmer roles, and local government.' },
        { type: 'pathway', title: 'ECONOMIC ACTIVITIES', text: 'Women-led enterprises, savings groups, and joint household income tracking.' },
        { type: 'pathway', title: 'ACCOUNTABILITY MECHANISMS', text: 'Community-level systems for reporting harassment, intimidation, or backlash — and acting on it.' },
        { type: 'callout', text: 'A Gender Smart Village isn\'t a project label — it is the result of sustained, layered work over multiple years. The pieces add up.' },
        { type: 'h', text: 'The role of cooperatives' },
        { type: 'p', text: 'Cooperatives are leverage points. A coffee cooperative with women on the board, women in senior staff roles, and women receiving direct payment for their work transmits gender norms across hundreds of households at once. Solidaridad partners with cooperatives on by-law reform, leadership development, and gender-disaggregated payment systems.' },
        { type: 'highlight', text: 'Change the cooperative, change the village. Change the village, change the chain.' },
      ],
    },
    {
      id: 'gender-sustaining',
      title: 'Sustaining Gender Outcomes',
      content: [
        { type: 'p', text: 'Many gender interventions show good results during the programme — and revert once funding ends. Sustainable gender change requires deliberate design from the start.' },
        { type: 'h', text: 'What makes gender outcomes stick' },
        { type: 'list', items: [
          'Institutional embedding — change in cooperative by-laws, not just behaviour',
          'Community ownership — local gender champions, not external trainers',
          'Economic anchoring — when women\'s income is secure, norms hold',
          'Male engagement — partners who support change, not just tolerate it',
          'Long horizons — gender programmes need 5-7 year cycles, not 2',
        ]},
        { type: 'h', text: 'Common failure modes' },
        { type: 'pathway', title: 'BACKLASH', text: 'Men withdraw support, increase control, or react violently when women gain visibility. Mitigated by engaging men from the start (EMAP), not only after the conflict appears.' },
        { type: 'pathway', title: 'TOKENISATION', text: 'One woman on the board, no real influence. Mitigated by aiming for critical mass (30%+ minimum) and active mentoring.' },
        { type: 'pathway', title: 'BURNOUT', text: 'Women take on programme leadership in addition to existing household burdens. Mitigated by genuinely reducing care-work expectations, not just adding programme participation.' },
        { type: 'pathway', title: 'ELITE CAPTURE', text: 'Better-off women benefit disproportionately. Mitigated by intersectional targeting — wealth, age, ethnicity, not just sex.' },
        { type: 'callout', text: 'If a gender outcome only survives while the project is running, it wasn\'t really an outcome — it was an activity.' },
        { type: 'h', text: 'Tracking what lasts' },
        { type: 'p', text: 'Solidaridad\'s gender M&E focuses on outcomes — women\'s income share, women on cooperative boards, household decision-making patterns — rather than activities (number of trainings, number of women trained). PMEL discipline matters here especially: aggregate numbers hide the gender story.' },
        { type: 'highlight', text: 'Sustainable gender change shows up in households that don\'t know the programme ever existed.' },
      ],
    },
    {
      id: 'gender-intersectionality',
      title: 'Inclusion Beyond Gender — Intersectionality',
      content: [
        { type: 'p', text: 'Gender does not exist in isolation. A young woman from an indigenous community in a remote district faces a different set of barriers than an older, urban, well-educated woman. Inclusive programming requires looking at multiple identities at once.' },
        { type: 'h', text: 'What intersectionality means' },
        { type: 'p', text: 'Intersectionality is the recognition that people experience the world through multiple overlapping identities — sex, age, ethnicity, class, ability, religion, geography, marital status — and that these intersect in ways that produce specific advantages and disadvantages.' },
        { type: 'callout', text: 'A programme that benefits "women" without specifying which women often benefits the women already best-positioned to participate.' },
        { type: 'h', text: 'Beyond binary gender' },
        { type: 'list', items: [
          'Youth — 60% of ECA\'s population, facing 20%+ unemployment',
          'Older women and men — often excluded from "productive" programmes despite expertise',
          'People with disabilities — agricultural programmes often inaccessible',
          'Indigenous Peoples — distinct land rights, languages, governance systems',
          'Migrants and displaced people — common in ECA, often without legal protections',
          'LGBTQI+ individuals — face additional risk in many contexts',
        ]},
        { type: 'h', text: 'In practice' },
        { type: 'pathway', title: 'DISAGGREGATE MORE', text: 'Don\'t stop at sex. Disaggregate by age (youth/adult/elder), location (rural/urban), ethnicity where appropriate, and other relevant markers.' },
        { type: 'pathway', title: 'TARGET DELIBERATELY', text: 'Use quotas or targets for under-represented groups — youth quotas, disability quotas, indigenous representation.' },
        { type: 'pathway', title: 'ADAPT DELIVERY', text: 'Trainings in local languages, accessible venues, translated materials, flexible scheduling.' },
        { type: 'pathway', title: 'PROTECT SAFETY', text: 'For marginalised groups, participation carries risk. Confidentiality, safety planning, and exit options matter.' },
        { type: 'highlight', text: 'Don\'t ask "are women included?" Ask "which women — and who is still missing?"' },
      ],
    },
    {
      id: 'gender-your-role',
      title: 'Your Role — Making it Real',
      content: [
        { type: 'p', text: 'Gender work isn\'t a specialism. It is part of every Solidaridad role — whether you are designing a project, monitoring a cooperative, writing a policy brief, or scheduling a field visit. Here is what you can do, from this week onwards.' },
        { type: 'h', text: 'In project design' },
        { type: 'list', items: [
          'Conduct a gender analysis at the start — not as an annex, as an input',
          'Set sex-disaggregated targets across all outcomes',
          'Budget for childcare, transport, and women-only sessions',
          'Plan for at least one transformative element, not just sensitive design',
          'Include men deliberately — through EMAP or community dialogues',
        ]},
        { type: 'h', text: 'In implementation' },
        { type: 'list', items: [
          'Schedule activities so women can actually attend',
          'Track sex-disaggregated participation every session',
          'Notice who speaks and who is silent in meetings — and act on it',
          'Support women in leadership roles, including practically',
          'Watch for backlash and escalate to your line manager or Gender Inclusivity Advisor',
        ]},
        { type: 'h', text: 'In PMEL & reporting' },
        { type: 'list', items: [
          'Disaggregate every indicator by sex and age (and more where relevant)',
          'Report on strategic outcomes (women on boards, women\'s income share), not just activities',
          'Tell the gender story honestly — including underperformance',
          'Capture stories of change that show norm shifts, not just numbers',
        ]},
        { type: 'h', text: 'In your team' },
        { type: 'list', items: [
          'Speak up about exclusion or bias when you see it, even subtly',
          'Mentor women and youth into bigger roles',
          'Use a Person of Trust if you experience or witness harassment',
          'Hold yourself and others to the 50% leadership and hiring targets',
        ]},
        { type: 'h', text: 'Where to get help' },
        { type: 'pathway', title: 'ECA GENDER INCLUSIVITY ADVISOR', text: 'Your first call for technical support — programme design, gender analysis, training facilitation, donor questions.' },
        { type: 'pathway', title: 'PERSON OF TRUST', text: 'Confidential support for personal experiences of harassment or exclusion. No obligation to escalate.' },
        { type: 'pathway', title: 'KAYA & JIFUNZE', text: 'Continued learning — refresher modules, deeper-dive content, communities of practice with peers in other regions.' },
        { type: 'pathway', title: 'GENDER TASK FORCE', text: 'Network-level body driving Solidaridad\'s gender agenda. ECA is represented; raise issues that need network attention.' },
        { type: 'highlight', text: 'Gender work is everyone\'s work. Start with one commitment this week.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Gender Programming Dilemmas',
    scenarios: [
      {
        situation: 'A Kenyan coffee cooperative you support has 60% women members but no women on the seven-person board. The cooperative chairperson says women "don\'t put themselves forward" for elections.',
        options: [
          { text: 'Accept the chairperson\'s explanation — women have equal opportunity to run.', correct: false, feedback: 'This is a gender-blind interpretation. "Women don\'t put themselves forward" usually reflects deeper barriers — confidence, family responsibilities, hostile meeting environments — not lack of opportunity.' },
          { text: 'Work with the cooperative on by-law reform (reserved seats, election timing, candidate support), pair with leadership training for women members, and engage current male leaders through EMAP-style sessions.', correct: true, feedback: 'Correct. This addresses the structural barriers (by-laws), builds women\'s capacity (training), and brings men in as allies rather than adversaries. Transformative work needs all three layers.' },
          { text: 'Push for a women-only cooperative as an alternative.', correct: false, feedback: 'Parallel structures rarely scale and often weaken women\'s position within mixed institutions. Better to transform the existing cooperative — that\'s where the volume, the market access, and the power are.' },
        ],
      },
      {
        situation: 'You are scheduling a series of agronomy trainings. The proposed dates are weekdays 9am-12pm. Field officers report women rarely attend.',
        options: [
          { text: 'Keep the schedule — the trainings are open to all. Attendance is up to women.', correct: false, feedback: 'This is the textbook gender-blind response. The schedule is invisible to men because it fits their lives — and invisible to women because it doesn\'t.' },
          { text: 'Move to afternoons (post-lunch), add childcare for under-fives, and run a separate evening session for women who want a women-only space.', correct: true, feedback: 'Correct. This addresses practical gender needs (time, childcare) and creates space for women-only learning where confidence may be higher. Both are needed.' },
          { text: 'Mandate that 50% of attendees must be women — refuse to train if the quota isn\'t met.', correct: false, feedback: 'A quota without addressing the actual barriers (timing, care, confidence) will only frustrate everyone. Fix the barriers first; the quota follows.' },
        ],
      },
      {
        situation: 'A male partner approaches you during a field visit, angry that his wife has joined a women\'s savings group through your programme. He says she is "neglecting her duties" and demands she leave the group.',
        options: [
          { text: 'Tell him this is his wife\'s decision and he should respect it.', correct: false, feedback: 'In many contexts, this could put the woman at risk. Confrontation with the husband while the woman is in earshot can escalate to harm.' },
          { text: 'Acknowledge his concerns, ask what specifically is challenging at home, invite him to learn more about the programme and join an EMAP-style session for partners. Follow up privately with the woman about her safety and choice.', correct: true, feedback: 'Correct. This de-escalates, opens a door to engagement (EMAP), and protects the woman through a private follow-up. Three things at once — that is gender-transformative work in action.' },
          { text: 'Remove the woman from the programme to avoid conflict.', correct: false, feedback: 'This punishes the woman for participating and signals to other partners that resistance works. Never the right call.' },
        ],
      },
      {
        situation: 'A donor reviewing your gold mining programme proposal asks why women make up only 30% of direct beneficiaries when their gender policy targets 50%. The artisanal mining sector you work in is genuinely 80% male.',
        options: [
          { text: 'Inflate the target to 50% to win the funding — figure out delivery later.', correct: false, feedback: 'This is exactly what the Ethics course warned against. Inflated targets become inflated reporting, then either fraud or backlash.' },
          { text: 'Explain the sector reality, propose 30% for direct ASM beneficiaries but add a second beneficiary group — women in mining-affected communities (processing, trading, household economies) — bringing the overall figure to 50%.', correct: true, feedback: 'Correct. This is honest, transformative (it expands the conception of who matters), and meets the donor\'s real concern: that women are not invisible in the value chain.' },
          { text: 'Argue the 50% target is unrealistic and ask the donor to lower it.', correct: false, feedback: 'Asking the donor to lower their gender ambition is a wasted opportunity. There are almost always ways to expand the lens and meet the target meaningfully.' },
        ],
      },
      {
        situation: 'A youth participant in your programme tells you that the "women\'s empowerment" framing excludes young men, who also face limited opportunities and feel ignored.',
        options: [
          { text: 'Explain that the programme is for women and youth can wait their turn.', correct: false, feedback: 'Dismissing youth concerns weakens the social fabric the programme depends on. Excluded young men can become future obstacles.' },
          { text: 'Add a parallel youth track that includes young men and young women — focused on economic opportunity, voice, and leadership — alongside the women-focused work.', correct: true, feedback: 'Correct. Intersectional programming recognises that gender and youth are both axes of exclusion. A parallel track addresses youth without diluting the women\'s component.' },
          { text: 'Rebrand the whole programme as "youth empowerment" to avoid the issue.', correct: false, feedback: 'Erasing the gender focus to please men is a classic regression. It often results in resources being redirected away from the women who needed the programme most.' },
        ],
      },
      {
        situation: 'You have just completed a gender analysis. It surfaces sensitive findings about gender-based violence in households connected to a cooperative you partner with. The cooperative chairperson asks you not to include this in your report.',
        options: [
          { text: 'Comply — protect the relationship.', correct: false, feedback: 'Omitting findings of GBV to protect a relationship makes you complicit in concealment. It also leaves women in those households without the structural support they need.' },
          { text: 'Refuse — publish everything in full detail.', correct: false, feedback: 'Public, detailed findings about identified households can endanger women. Naming matters less than action.' },
          { text: 'Report the findings in aggregate (no household-level identification), share confidentially with the cooperative leadership for action, escalate to the Regional Gender Inclusivity Advisor, and ensure SASA!-style community work is added to the programme.', correct: true, feedback: 'Correct. This honours the data, protects identities, holds the cooperative accountable through proper channels, and adds the right programmatic response. Three priorities at once.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'What is the difference between sex and gender?', options: ['They are the same thing', 'Sex is biological; gender is socially constructed', 'Sex changes over time; gender does not', 'Gender is biological; sex is socially constructed'], answer: 1 },
    { q: 'Gender equality vs gender equity — which is which?', options: ['Equality = same treatment; equity = treatment based on need to reach same outcome', 'Equity = same treatment; equality = treatment based on need', 'They mean the same thing', 'Equality is for women; equity is for men'], answer: 0 },
    { q: 'Which is the highest level on the gender programming spectrum?', options: ['Gender-blind', 'Gender-aware', 'Gender-sensitive', 'Gender-transformative'], answer: 3 },
    { q: 'In Moser\'s framework, "women on the cooperative board" is an example of:', options: ['A practical gender need', 'A strategic gender need', 'A biological need', 'A market need'], answer: 1 },
    { q: 'Who developed the GALS methodology?', options: ['Linda Mayoux', 'Caroline Moser', 'Naila Kabeer', 'Rachel Wanyoike'], answer: 0 },
    { q: 'The "Gender Balance Tree" is a tool used in:', options: ['EMAP', 'EA$E', 'GALS', 'SASA!'], answer: 2 },
    { q: 'What does EMAP stand for?', options: ['Engaging Men in Accountable Practices', 'Empowerment of Marginalised African People', 'Economic Models for Agricultural Progress', 'European Methodology for Agricultural Policy'], answer: 0 },
    { q: 'EA$E combines savings & loan groups with:', options: ['Carbon credits', 'Structured gender and household decision-making discussions', 'Mobile money training only', 'Pest management training'], answer: 1 },
    { q: 'What does SASA! stand for?', options: ['Sustainable Agriculture, Sustainable Africa', 'Start, Awareness, Support, Action', 'Sub-Saharan African Standards Agency', 'Solidaridad Action for Social Advancement'], answer: 1 },
    { q: 'Gender Smart Villages are best described as:', options: ['A label given to villages that meet a checklist', 'A multi-component model integrating gender champions, community dialogues, leadership pipelines, and accountability mechanisms', 'A digital tool', 'A type of farmer field school for women only'], answer: 1 },
    { q: 'In which year did Solidaridad adopt its global Gender Policy?', options: ['2010', '2015', '2017', '2020'], answer: 2 },
    { q: 'In sub-Saharan Africa, women\'s share of agricultural labour is approximately:', options: ['10-20%', '30-40%', '60-80%', '95-100%'], answer: 2 },
    { q: 'Sex-disaggregated data means:', options: ['Data on sexual behaviour', 'Data broken down separately for women and men (and other identities)', 'Aggregate data combining both sexes', 'Data collected only from women'], answer: 1 },
    { q: 'Intersectionality is:', options: ['A type of road junction', 'Recognising that people experience the world through multiple overlapping identities — sex, age, ethnicity, class, etc.', 'Combining two methodologies', 'A type of cooperative structure'], answer: 1 },
    { q: 'The four modules of Solidaridad\'s gender e-learning course are:', options: ['Gender Basics, Gender Analysis, Gender Responsive Programming, Sustainability & Inclusivity', 'Gender 101, GALS, EMAP, SASA!', 'Women, Men, Youth, Children', 'Sex, Gender, Identity, Inclusion'], answer: 0 },
  ],
});


COURSES.push({
  id: 'eudr',
  title: 'EUDR: EU Deforestation Regulation',
  subtitle: 'What every Solidaridad staff member needs to know',
  category: 'EUDR',
  icon: commodityIcon(eudrIcon),
  duration: '1 hr 5 min',
  description: 'A comprehensive overview of Regulation (EU) 2023/1115 — the EU Deforestation Regulation — and what it means in practice for Solidaridad ECA staff, cooperatives, and smallholder producers of coffee, cocoa, palm oil, cattle products, and wood.',
  lessons: [
    {
      id: 'eudr-overview',
      title: 'EUDR Overview & Why It Matters',
      content: [
        { type: 'p', text: 'For East and Central African producers and the cooperatives Solidaridad supports, EUDR — the EU Deforestation Regulation — is one of the most consequential policy shifts of the decade. By the end of 2026, products entering the EU must prove they did not contribute to deforestation.' },
        { type: 'h', text: 'The regulation in one sentence' },
        { type: 'p', text: 'Regulation (EU) 2023/1115 — the EU Deforestation Regulation — bans products linked to deforestation or forest degradation after 31 December 2020 from entering or leaving the EU market.' },
        { type: 'highlight', text: 'No deforestation. No degradation. No exceptions.' },
        { type: 'h', text: 'Why this matters for ECA' },
        { type: 'p', text: 'ECA exports coffee, cocoa, palm oil, cattle products, and wood — all on the EUDR list. Europe is a major destination market. Small-scale producers across Ethiopia, Kenya, Tanzania, and Uganda will be directly affected by how the regulation is implemented in their supply chains.' },
        { type: 'list', items: [
          'Coffee — Ethiopia, Kenya, Tanzania, and Uganda all major exporters',
          'Cocoa — Tanzania',
          'Palm oil — Tanzania',
          'Cattle and leather — dairy and beef across the region',
          'Wood and timber products — Uganda, Tanzania',
        ]},
        { type: 'callout', text: 'This isn\'t a future concern. It\'s a 2026-2027 deadline already in motion.' },
        { type: 'h', text: 'The seven commodities in scope' },
        { type: 'p', text: 'EUDR covers seven raw commodities and a long list of products derived from them. If your value chain touches any of these, EUDR applies.' },
        { type: 'pathway', title: 'CATTLE', text: 'Beef and leather products. Major implications for dairy chains where breeding stock or culled animals enter beef/leather streams.' },
        { type: 'pathway', title: 'WOOD', text: 'Timber, furniture, paper, charcoal, pulp. EUDR repeals the existing EU Timber Regulation (EUTR), which it replaces and extends.' },
        { type: 'pathway', title: 'COCOA', text: 'Cocoa beans, paste, butter, powder, and chocolate products.' },
        { type: 'pathway', title: 'SOY', text: 'Beans, oil, flour — used widely in animal feed and processed food.' },
        { type: 'pathway', title: 'PALM OIL', text: 'Crude and refined oils, and derivatives used in food and cosmetics.' },
        { type: 'pathway', title: 'COFFEE', text: 'Green and roasted coffee, and extracts. The highest-volume EUDR commodity from ECA by far.' },
        { type: 'pathway', title: 'RUBBER', text: 'Natural rubber, tyres, and many industrial products.' },
        { type: 'callout', text: 'Of these seven, five are directly relevant to ECA today: cattle (dairy/leather), wood, cocoa, palm oil, and coffee. Soy and rubber are limited in ECA but growing.' },
        { type: 'h', text: 'Solidaridad\'s role' },
        { type: 'p', text: 'Solidaridad has been working on traceability and responsible sourcing for over a decade. EUDR formalises and accelerates what we already do — and gives us a clear role: support producers and cooperatives to comply, ensure smallholders are not excluded, and shape implementation so it works for the people we serve.' },
        { type: 'highlight', text: 'EUDR can be a disaster for smallholders, or a leverage point. Which one depends on how it\'s implemented.' },
      ],
    },
    {
      id: 'eudr-core-rules',
      title: 'The Core Rules — Deforestation-Free + Legal',
      content: [
        { type: 'p', text: 'EUDR has two conditions. A product can only enter the EU if BOTH are met:' },
        { type: 'pathway', title: 'DEFORESTATION-FREE', text: 'The commodity must come from land that was not deforested or forest-degraded after 31 December 2020. This is the cutoff date. Land legally cleared from forest before that date is fine; land cleared after is not.' },
        { type: 'pathway', title: 'LEGAL', text: 'The commodity must be produced in compliance with the relevant laws of the country of production. This includes land use, environment, labour, human rights, third-party rights (especially indigenous), trade and customs, and tax.' },
        { type: 'highlight', text: 'BOTH conditions must hold. One isn\'t enough.' },
        { type: 'h', text: 'What counts as deforestation?' },
        { type: 'p', text: 'EUDR uses the FAO definition: conversion of forest to other land use, whether human-induced or not. The forest definition is also FAO-based — areas larger than 0.5 hectares with tree canopy cover of more than 10 percent.' },
        { type: 'h', text: 'What counts as degradation?' },
        { type: 'p', text: 'Structural changes to forest cover — for example, conversion of primary forest or naturally regenerating forest to plantation forest. This is narrower than some interpretations but still important for ECA, where forest plantations are common.' },
        { type: 'callout', text: 'The cutoff date matters more than anything else. Land legally cleared in 2018? Compliant. Same land cleared in 2021? Not compliant.' },
        { type: 'h', text: 'Why a cutoff date?' },
        { type: 'p', text: 'The cutoff prevents producers from being penalised for historical land-use decisions, while making it clear that any new deforestation after the chosen date is unacceptable. 31 December 2020 was chosen as a balance — recent enough to drive change, far enough back to avoid retroactive impact.' },
      ],
    },
    {
      id: 'eudr-roles-dd',
      title: 'Roles & Due Diligence',
      content: [
        { type: 'p', text: 'EUDR places obligations on businesses operating in the EU market, not on producers in countries of origin. But the requirements flow upstream to every farm and cooperative in the supply chain.' },
        { type: 'h', text: 'Who does what' },
        { type: 'pathway', title: 'OPERATORS', text: 'The first business to place a product on the EU market — or export it from the EU. Operators bear primary due diligence responsibility and submit Due Diligence Statements (DDS).' },
        { type: 'pathway', title: 'TRADERS', text: 'Buy and sell within the EU after the product is placed. Their obligations are lighter — keep records and pass information.' },
        { type: 'pathway', title: 'SMES', text: 'Small and medium enterprises get simplified requirements. Micro and small operators also get a later compliance date (June 2027 vs December 2026).' },
        { type: 'pathway', title: 'SMALLHOLDERS', text: 'Not directly liable under EUDR. But the operators above them need their data — geolocation, production history — to lodge their DDS. Without smallholder data, operators cannot buy.' },
        { type: 'h', text: 'The flow of information' },
        { type: 'p', text: 'A typical chain: smallholder farm → village collector → cooperative → exporter → EU importer (operator). Each step needs to pass information upstream so the operator can lodge a compliant DDS.' },
        { type: 'callout', text: 'The legal obligation sits with the EU operator. The practical work — geolocation, polygon mapping, record-keeping — happens at the farm and cooperative level.' },
        { type: 'highlight', text: 'Smallholders aren\'t on the hook for EUDR. But they will be on the hook for market access.' },
        { type: 'h', text: 'The three steps of due diligence' },
        { type: 'p', text: 'Every consignment of a covered commodity entering or leaving the EU must be backed by a Due Diligence Statement (DDS). Lodging a DDS requires a three-step process:' },
        { type: 'pathway', title: 'STEP 1 — INFORMATION COLLECTION', text: 'Geolocation of every plot, country of production, commodity, quantity, supplier and buyer identification, date or time range of production.' },
        { type: 'pathway', title: 'STEP 2 — RISK ASSESSMENT', text: 'Operator evaluates the risk that the product is non-compliant. Factors include country benchmark, supply chain complexity, presence of indigenous peoples, anonymity of suppliers, and prevalence of deforestation in the region.' },
        { type: 'pathway', title: 'STEP 3 — RISK MITIGATION', text: 'Where risk is more than negligible, operators must mitigate — collect more information, conduct third-party audits, build supplier capacity, or remove high-risk supply.' },
        { type: 'h', text: 'The Due Diligence Statement (DDS)' },
        { type: 'p', text: 'Once due diligence is complete, the operator lodges a DDS in the EU Information System. The DDS receives a unique reference number that follows the product through the supply chain.' },
        { type: 'highlight', text: 'No DDS, no EU market. It\'s that simple.' },
        { type: 'callout', text: 'Records must be kept for at least 5 years. Auditors and competent authorities can request them at any time.' },
      ],
    },
    {
      id: 'eudr-geolocation-risk',
      title: 'Geolocation, Systems & Country Risk',
      content: [
        { type: 'p', text: 'Geolocation is the technical centrepiece of EUDR. Every plot of land where a covered commodity was produced must be precisely mapped.' },
        { type: 'h', text: 'What geolocation looks like' },
        { type: 'list', items: [
          'Plots over 4 hectares (and any cattle production): full polygon — boundaries traced',
          'Plots under 4 hectares (for non-cattle commodities): a single point — latitude/longitude coordinates',
          'For cattle: polygons of all establishments where the animal lived',
        ]},
        { type: 'callout', text: 'For coffee in ECA, most smallholder plots are under 4 hectares — so a point coordinate is usually enough. For cocoa plots, the same. For dairy farms producing leather, polygons are required.' },
        { type: 'h', text: 'The EU Information System' },
        { type: 'p', text: 'The EUDR Information System launched on 4 December 2024. Operators and traders register and lodge their Due Diligence Statements through it. Each DDS receives a reference number that travels with the product down the chain.' },
        { type: 'h', text: 'Practical realities' },
        { type: 'list', items: [
          'A standard smartphone GPS can capture point coordinates accurately enough for under-4 ha plots',
          'Polygon mapping requires more sophisticated tools but is increasingly affordable',
          'Cooperatives often handle the mapping on behalf of their members',
          'Solichain — Solidaridad\'s blockchain traceability platform — captures EUDR-required data and produces audit-ready records',
        ]},
        { type: 'highlight', text: 'The map is the single most important EUDR deliverable for smallholder supply chains.' },
        { type: 'h', text: 'Country benchmarking' },
        { type: 'p', text: 'The European Commission classifies every country of production into a risk category. This determines how much due diligence operators must do — and how often they will be inspected.' },
        { type: 'pathway', title: 'LOW RISK', text: 'Simplified due diligence — operators can lodge a DDS based on information collection alone. Minimal risk assessment required.' },
        { type: 'pathway', title: 'STANDARD RISK', text: 'The default category. Full due diligence required. Competent authorities inspect 3% of operators per year.' },
        { type: 'pathway', title: 'HIGH RISK', text: 'Enhanced due diligence required. Inspections at 9% of operators per year. Greater scrutiny of supply chains and more frequent audits.' },
        { type: 'h', text: 'Where ECA countries sit' },
        { type: 'p', text: 'At launch, most countries are classified as standard risk by default — including Ethiopia, Kenya, Uganda, and Tanzania. The list is reviewed periodically based on data, including satellite-derived deforestation rates.' },
        { type: 'callout', text: 'Standard risk is the working assumption for ECA. But if a country\'s deforestation rates rise, classification can shift to high risk — with significant trade consequences.' },
      ],
    },
    {
      id: 'eudr-timeline',
      title: 'Timeline & Recent Amendments',
      content: [
        { type: 'p', text: 'EUDR has had a turbulent journey from adoption to application. The current state of play:' },
        { type: 'pathway', title: 'ADOPTED — 2023', text: 'Regulation (EU) 2023/1115 entered into force in June 2023.' },
        { type: 'pathway', title: 'ORIGINAL APPLICATION', text: 'Set for 30 December 2024 — then postponed.' },
        { type: 'pathway', title: 'FIRST AMENDMENT — December 2024', text: 'Application delayed by twelve months to 30 December 2025 for large/medium operators, with a longer grace period for micro/small.' },
        { type: 'pathway', title: 'SECOND AMENDMENT — December 2025', text: 'Further delay plus simplification measures to reduce administrative burden. Current dates: 30 December 2026 for large/medium operators; 30 June 2027 for micro/small operators (and 30 December 2026 for micro/small operators already covered by EUTR).' },
        { type: 'callout', text: 'The current application dates — 30 December 2026 for large/medium operators, 30 June 2027 for micro/small operators — are the deadlines to plan around as of now.' },
        { type: 'h', text: 'Why the delays?' },
        { type: 'p', text: 'Industry, EU Member States, and many producing countries argued that the original timeline didn\'t give value chains enough time to set up compliance systems. Smallholders were a particular concern — geolocation at scale takes time and investment. The Commission accepted the case and built in simplification measures alongside the delays.' },
        { type: 'h', text: 'Has anything changed in substance?' },
        { type: 'p', text: 'The cutoff date remains 31 December 2020. The seven commodities remain in scope. The deforestation-free + legal requirement remains. The simplifications focus on reducing administrative complexity — not weakening environmental ambition.' },
        { type: 'highlight', text: 'The direction is clear. The deadline has shifted. Solidaridad\'s job is to use the extra time well.' },
      ],
    },
    {
      id: 'eudr-eca-response',
      title: 'Implications for ECA & Solidaridad\'s Response',
      content: [
        { type: 'p', text: 'EUDR is not designed to exclude smallholders. But poorly implemented, it could. Understanding the risks and opportunities is essential for everyone working with smallholder cooperatives.' },
        { type: 'h', text: 'Risks for smallholders' },
        { type: 'pathway', title: 'EXCLUSION', text: 'If cooperatives cannot provide geolocation and due diligence data, operators may shift to larger plantations or alternative origins.' },
        { type: 'pathway', title: 'COST PASS-THROUGH', text: 'Cost of compliance (mapping, traceability systems, audits) may be deducted from farmgate prices.' },
        { type: 'pathway', title: 'AGGREGATION FAILURE', text: 'Cooperatives that aggregate from many small farms must track every plot. Capacity gaps could disqualify whole cooperatives from compliant supply.' },
        { type: 'pathway', title: 'POLYGON MAPPING PENALTY', text: 'Smallholders with plots over 4 ha (some coffee, most dairy, some cocoa) face higher mapping costs than smaller plots.' },
        { type: 'h', text: 'Opportunities' },
        { type: 'pathway', title: 'PREMIUM POSITIONING', text: 'Compliant smallholder origins become preferred suppliers. Premiums and longer-term contracts follow.' },
        { type: 'pathway', title: 'TRACEABILITY INVESTMENT', text: 'EUDR funds the rollout of digital tools (Solichain, MRV systems) that benefit far beyond compliance — including carbon markets and quality grading.' },
        { type: 'pathway', title: 'COOPERATIVE STRENGTHENING', text: 'Cooperatives that build EUDR systems become more sophisticated organisations across the board.' },
        { type: 'pathway', title: 'CLIMATE FINANCE', text: 'Forest-positive production attracts new finance flows — carbon, climate adaptation, biodiversity.' },
        { type: 'callout', text: 'The smallholder who is mapped, organised, and compliant has a stronger position in 2027 than they had in 2023. The smallholder who isn\'t risks being priced out.' },
        { type: 'h', text: 'Solidaridad\'s tools' },
        { type: 'p', text: 'Solidaridad has been preparing for EUDR — and supporting producers to prepare — since before the regulation was adopted. Several tools and programmes are already in place across ECA.' },
        { type: 'pathway', title: 'SOLICHAIN', text: 'Our blockchain traceability platform. Captures farm-level data, commodity flow, geolocation, and certification — and produces audit-ready records aligned with EUDR requirements.' },
        { type: 'pathway', title: 'POLYGON MAPPING', text: 'Through field teams and partner organisations, Solidaridad supports cooperatives to geolocate plots — using GPS-enabled phones for points and drone/GIS tools for polygons.' },
        { type: 'pathway', title: 'COOPERATIVE CAPACITY BUILDING', text: 'Training cooperative staff on data collection, record-keeping, risk assessment, and supplier verification.' },
        { type: 'pathway', title: 'BUYER PARTNERSHIPS', text: 'Working with EU coffee and cocoa buyers (Volcafe, Touton, ECOM, Starbucks, others) on responsible sourcing commitments that include EUDR readiness.' },
        { type: 'pathway', title: 'CARBON & EUDR INTEGRATION', text: 'Carbon pre-finance enables farmers to invest in EUDR-compliant systems without bearing the upfront cost.' },
        { type: 'pathway', title: 'ADVOCACY', text: 'Solidaridad engages with the EU and partner governments on smallholder-sensitive implementation — including through the Team Europe Initiative on Deforestation-free Value Chains.' },
        { type: 'callout', text: 'EUDR isn\'t a new programme. It\'s an acceleration of the work Solidaridad has been doing on traceability, regenerative production, and inclusive supply chains for over a decade.' },
        { type: 'highlight', text: 'Our tools were built for sustainability. EUDR is the moment they prove their worth.' },
      ],
    },
    {
      id: 'eudr-your-role',
      title: 'Your Role — Making EUDR Work',
      content: [
        { type: 'p', text: 'You don\'t need to be a regulatory expert to engage with EUDR in your role. But you do need to know the basics — so you can answer farmer questions, brief partners, and design EUDR-ready interventions.' },
        { type: 'h', text: 'When farmers and cooperatives ask' },
        { type: 'list', items: [
          'The cutoff date is 31 December 2020. Land legally cleared before this date is fine.',
          'You need geolocation of your plot — usually one GPS point if under 4 hectares.',
          'You need records of who you sell to. Your cooperative will help.',
          'Solidaridad supports the work — through Solichain, training, and buyer partnerships.',
          'The deadline is 30 December 2026 for most operators, 30 June 2027 for small operators.',
        ]},
        { type: 'h', text: 'When buyers and donors ask' },
        { type: 'list', items: [
          'Solidaridad has EUDR-ready tools and active programmes in coffee, cocoa, palm oil, and dairy',
          'Solichain provides traceability evidence aligned with EUDR data requirements',
          'We can support cooperative onboarding to EUDR-compliant systems',
          'We engage with the Team Europe Initiative and the EU Multi-Stakeholder Platform',
        ]},
        { type: 'h', text: 'When designing projects' },
        { type: 'list', items: [
          'Build EUDR-readiness into every relevant project from the start',
          'Budget for geolocation and traceability tools',
          'Plan for cooperative capacity building, not just farmer training',
          'Coordinate with buyer partners on data sharing',
          'Use carbon pre-finance to enable farmer investment',
        ]},
        { type: 'h', text: 'Red flags to escalate' },
        { type: 'list', items: [
          'Reports of new clearing in or near partner farms — even small areas — should be reported to your line manager and the Programmes team',
          'Cooperatives claiming compliance without geolocation data',
          'Buyers asking for compliance shortcuts that bypass producers',
          'Pressure to fabricate or estimate plot data',
        ]},
        { type: 'h', text: 'Where to get help' },
        { type: 'list', items: [
          'Country Programmes lead — for sector-specific questions',
          'Regional Sustainability / Climate team — for EUDR-specific technical support',
          'Solichain support — for traceability platform questions',
          'Knowledge Hub — for the latest EU guidance and Solidaridad position papers',
        ]},
        { type: 'highlight', text: 'EUDR isn\'t a regulatory burden to comply with. It\'s a chance to do better work, more visibly, for our farmers.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six EUDR Field Scenarios',
    scenarios: [
      {
        situation: 'A coffee cooperative member asks if her plot is deforestation-free. She has farmed the land since 2015 — the area was forest until 2018, when she cleared it legally for coffee.',
        options: [
          { text: 'Tell her the land is non-compliant because it was once forest.', correct: false, feedback: 'Land cleared before the cutoff date is fine under EUDR. Treating any historical forest as non-compliant misreads the regulation.' },
          { text: 'Confirm that her plot is EUDR-compliant — the cutoff date is 31 December 2020, and her land was cleared (legally) before that.', correct: true, feedback: 'Correct. The 2020 cutoff is fixed. Any land legally cleared before then is compliant. Knowing this is the single most important piece of EUDR information you can give farmers.' },
          { text: 'Tell her you can\'t answer until the EU classifies her country.', correct: false, feedback: 'Country benchmarking affects the intensity of operator audits, not the cutoff date. The cutoff applies the same way regardless of country classification.' },
        ],
      },
      {
        situation: 'A Tanzanian cocoa exporter asks Solidaridad to provide a Due Diligence Statement on their behalf. They cite the long relationship and lack of in-house capacity.',
        options: [
          { text: 'Provide the DDS — we have the data they need.', correct: false, feedback: 'DDS responsibility is a legal obligation on the operator. Solidaridad cannot and should not assume it. Doing so blurs accountability and could expose us to liability.' },
          { text: 'Explain that DDS responsibility sits with the operator (the exporter), but Solidaridad can support them with traceability data through Solichain, cooperative capacity building, and connections to qualified service providers.', correct: true, feedback: 'Correct. Solidaridad supports — it does not assume legal obligations of operators. Clear role separation protects everyone and keeps accountability where it belongs.' },
          { text: 'Refer them to the EU directly.', correct: false, feedback: 'Unhelpful. The exporter needs practical support to build their own capacity. Solidaridad has tools and partnerships precisely for this — we just don\'t take on their legal obligations.' },
        ],
      },
      {
        situation: 'During a field visit, a field officer notices a small (0.3 ha) area of recent clearing inside a coffee cooperative\'s mapped area. The cooperative leadership claims it was a natural fire, not deliberate clearing.',
        options: [
          { text: 'Accept the explanation — small areas don\'t matter under EUDR.', correct: false, feedback: 'Under EUDR, even small clearings inside a mapped supply area can trigger non-compliance for affected plots. Size doesn\'t exempt — the cutoff date and cause do.' },
          { text: 'Mark the entire cooperative as non-compliant immediately.', correct: false, feedback: 'Over-reaction. Only the affected plots are at risk. Investigation and documentation come first.' },
          { text: 'Document the area with photos and GPS, flag it to your line manager, ask the cooperative for evidence of cause and any restoration plans, and ensure affected plots are excluded from EUDR-compliant volumes pending verification.', correct: true, feedback: 'Correct. Under EUDR, even small clearings inside a mapped supply area matter. The cause (fire, illegal clearing, etc.) affects the legality test. Always document, escalate, and protect the supply chain integrity.' },
        ],
      },
      {
        situation: 'A smallholder farmer is being told by a middleman buyer that he will be excluded from the market because he doesn\'t have geolocation data. The farmer asks Solidaridad for help.',
        options: [
          { text: 'Tell the farmer EUDR is unfair and he should look for non-EU buyers.', correct: false, feedback: 'This is fatalism dressed up as advice. Non-EU markets are not always better-paying, and the farmer\'s long-term position depends on becoming EUDR-ready, not avoiding it.' },
          { text: 'Connect the farmer to his cooperative for geolocation mapping (a single GPS point may suffice for plots under 4 ha), check whether the cooperative is enrolled in Solichain or a similar platform, and escalate to the Programmes team if the cooperative needs support.', correct: true, feedback: 'Correct. Most smallholder farmers need surprisingly little to be EUDR-ready — a point GPS coordinate and inclusion in cooperative records. The blocker is usually cooperative capacity, not farmer effort. Connect, don\'t shoulder.' },
          { text: 'Promise the farmer Solidaridad will pay for his compliance.', correct: false, feedback: 'Solidaridad supports systems, not individual compliance payments. Promising individual financial support sets unsustainable expectations and isn\'t how our work scales.' },
        ],
      },
      {
        situation: 'A donor asks Solidaridad to include EUDR-readiness as a deliverable in a new project proposal. The donor wants 50% of partner farmers EUDR-compliant by the end of year 1.',
        options: [
          { text: 'Accept the 50% target — donors set targets and we deliver.', correct: false, feedback: 'Accepting unrealistic targets is exactly what the Ethics course warned against. Compliance requires cooperative-level work; 50% in year 1 may be deliverable in some contexts and not in others.' },
          { text: 'Reject the deliverable — EUDR is not our core business.', correct: false, feedback: 'EUDR is squarely within Solidaridad\'s sustainable supply chains work and MASP IV. Rejecting it would miss a major opportunity.' },
          { text: 'Engage constructively — propose a phased plan: 100% geolocation by end of year 1, full DDS-readiness for 60-70% of supply by end of year 2, recognising that compliance requires cooperative-level work, not just farm-level work.', correct: true, feedback: 'Correct. EUDR-readiness is more than a counting exercise. A realistic phased plan is more honest, more deliverable, and more impactful than an over-promised target.' },
        ],
      },
      {
        situation: 'Solidaridad\'s PMEL team reports that 12% of mapped plots in a coffee programme show clearing after the cutoff date.',
        options: [
          { text: 'Remove the data from the report.', correct: false, feedback: 'This is data manipulation — directly contrary to the Ethics course and Solidaridad\'s integrity values. It would also leave the supply chain exposed when buyers discover the issue.' },
          { text: 'Report the 12% as a programme failure and close the project.', correct: false, feedback: 'Over-reaction. A 12% non-compliance rate is a finding to act on, not a project to close. Many programmes will face similar issues — what matters is the response.' },
          { text: 'Report the finding honestly, work with the cooperative on a root cause analysis (was clearing legal? planned? a misunderstanding?), design a remediation pathway, discuss with buyers transparently, and update the supply chain mapping to exclude affected plots from EUDR-compliant volumes.', correct: true, feedback: 'Correct. EUDR transparency builds trust. Hidden non-compliance is far more damaging than openly addressed non-compliance. Honest reporting plus remediation is the only sustainable path.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'What does EUDR stand for?', options: ['European Union Development Regulation', 'EU Deforestation Regulation', 'European Universal Diet Requirements', 'EU Drought Response'], answer: 1 },
    { q: 'What is the official regulation number?', options: ['Regulation (EU) 2020/852', 'Regulation (EU) 2023/1115', 'Regulation (EU) 2024/1789', 'Directive 2014/95/EU'], answer: 1 },
    { q: 'EUDR replaces which earlier regulation?', options: ['CSDDD', 'EU Timber Regulation (EUTR)', 'GDPR', 'CITES'], answer: 1 },
    { q: 'The deforestation cutoff date under EUDR is:', options: ['1 January 2018', '31 December 2020', '31 December 2023', '1 January 2026'], answer: 1 },
    { q: 'Which is NOT one of the seven EUDR commodities?', options: ['Coffee', 'Cocoa', 'Sugar', 'Rubber'], answer: 2 },
    { q: 'The current application date for large and medium operators is:', options: ['30 December 2024', '30 December 2025', '30 December 2026', '30 June 2027'], answer: 2 },
    { q: 'The current application date for micro and small operators is:', options: ['30 December 2024', '30 December 2025', '30 December 2026', '30 June 2027'], answer: 3 },
    { q: 'The three steps of due diligence are:', options: ['Plan, do, check', 'Information, risk assessment, risk mitigation', 'Map, measure, monitor', 'Report, review, renew'], answer: 1 },
    { q: 'Who bears primary EUDR responsibility?', options: ['Smallholder farmers', 'Operators (first to place product on EU market)', 'Cooperatives', 'Country governments'], answer: 1 },
    { q: 'For a coffee plot under 4 hectares, geolocation requires:', options: ['A full polygon', 'A single GPS point (latitude/longitude)', 'A satellite photograph', 'Government certification'], answer: 1 },
    { q: 'Country benchmarking categories are:', options: ['Compliant / Non-compliant', 'Low / Standard / High risk', 'Green / Amber / Red', 'A / B / C / D'], answer: 1 },
    { q: 'The EU Information System for EUDR launched on:', options: ['1 January 2023', '4 December 2024', '30 December 2025', '30 December 2026'], answer: 1 },
    { q: 'Solidaridad\'s blockchain traceability platform is called:', options: ['SolarChain', 'Solichain', 'Solidaridad Track', 'Jifunze'], answer: 1 },
    { q: 'How long must EUDR records be kept?', options: ['1 year', '3 years', 'At least 5 years', 'Indefinitely'], answer: 2 },
    { q: 'For Solidaridad ECA staff, EUDR is best understood as:', options: ['A regulatory burden to minimise', 'An acceleration of work we already do on traceability and responsible sourcing', 'Solely an EU concern, not a Solidaridad concern', 'Only relevant to coffee'], answer: 1 },
  ],
});


COURSES.push({
  id: 'soy',
  title: 'Soy: Crop, Practice & Programme',
  subtitle: 'Solidaridad\'s soy curriculum at a glance',
  category: 'Commodities',
  icon: commodityIcon(soyIcon),
  duration: '1 hr 10 min',
  description: 'A seven-module summary of Solidaridad\'s Soy Training Manual — developed under SATSBIS (Southern Africa towards Soybean Import Substitution) and applicable wherever Solidaridad works with soy. Designed for staff who support field teams, partner cooperatives, and farmer training programmes.',
  lessons: [
    {
      id: 'soy-overview',
      title: 'Module 1 — Soy & Solidaridad\'s Soy Work',
      content: [
        { type: 'p', text: 'Soy is one of Solidaridad\'s primary commodities — a high-protein, high-value crop that improves soil health, generates household income, and underpins regional food security. This course is a working summary of Solidaridad\'s Soy Training Manual.' },
        { type: 'h', text: 'Why soy matters' },
        { type: 'list', items: [
          'Cash crop and income generator for smallholder farmers',
          'Food and nutrition — over 36% protein, 30% carbohydrates, 20% oil, plus dietary fibre, vitamins and minerals',
          'Soil improver — fixes nitrogen, helps control the parasitic weed Striga, breaks pest cycles',
          'Animal feed — basis of poultry, dairy, and aquaculture feed industries',
          'Industrial uses — biodiesel, soaps, processed food, edible oil, soy milk, soy chunks',
        ]},
        { type: 'h', text: 'The yield gap' },
        { type: 'stat', number: '3-4 t/ha', label: 'Potential yield with good practices', detail: 'Achievable on smallholder farms with the right variety, inputs, and methods' },
        { type: 'stat', number: '0.6 t/ha', label: 'Current smallholder average', detail: 'Driven by poor practices rather than crop limitations' },
        { type: 'callout', text: 'The yield gap is the entire opportunity. Closing it is what good extension support delivers.' },
        { type: 'h', text: 'Solidaridad\'s soy work' },
        { type: 'p', text: 'This course is built on the Solidaridad Soy Training Manual developed under SATSBIS (Southern Africa towards Soybean Import Substitution) — a 33,200-farmer programme spanning Angonia and Gurue in Mozambique, Katete in Zambia, and Kasungu in Malawi. The same curriculum and methods are applied wherever Solidaridad works with soy, including ECA.' },
        { type: 'pathway', title: 'RTRS CERTIFICATION', text: 'The Round Table on Responsible Soy is the international platform for monitoring soy production sustainability. Benefits: better farm management, soil protection, water management, improved bank loan conditions, and access to premium markets.' },
        { type: 'pathway', title: 'FARMER ID', text: 'Every Solidaridad-recognised farmer receives a unique alphanumeric ID with a QR code, used to track participation, training adoption, and field outcomes. The ID is foundational to digitised supply chains.' },
        { type: 'pathway', title: 'DIGITAL TOOLS', text: 'Solidaridad farmers access Wadi (WhatsApp-based virtual assistant for weather, soil testing, training content), Z\'wardy (rewards programme for recording farming practices), and integration into Solichain.' },
        { type: 'pathway', title: 'KEY PARTNERS', text: 'SATSBIS works with KDV (Netherland Pork Producers), RTRS, and REC NL on the demand side, and local ministries of agriculture on the supply side. The model is replicable across other Solidaridad soy programmes.' },
        { type: 'h', text: 'Soybean production calendar' },
        { type: 'p', text: 'For Mozambique, Malawi, and Zambia, the typical soy calendar runs: soil sampling and preparation (August-October), planting (November-December), fertilisation and pest/disease control (December-February), weed control (December-March), harvesting (March-May), and marketing (May-July). ECA timing varies by latitude and rainfall pattern.' },
        { type: 'highlight', text: 'Soy is a high-leverage commodity. Get the agronomy right and income, soil health, and nutrition follow.' },
      ],
    },
    {
      id: 'soy-varieties',
      title: 'Module 2 — Crop Requirements, Varieties & Seed Quality',
      content: [
        { type: 'p', text: 'Successful soy production starts with picking the right variety for the agroclimatic zone and using quality seed. Get this wrong and no amount of field management can compensate.' },
        { type: 'h', text: 'Soybean growth habits' },
        { type: 'pathway', title: 'DETERMINATE TYPES', text: 'Short, terminate growth. Growth ends with flowering. Pods ripen together — can be harvested in one round.' },
        { type: 'pathway', title: 'INDETERMINATE TYPES', text: 'Grow up to 70 cm. Continuous vegetative growth with flowering and pod-forming overlapping. Seeds and pods of different sizes — manual harvesting in multiple rounds.' },
        { type: 'h', text: 'Agroclimatic requirements' },
        { type: 'list', items: [
          'Warm weather — soy is a warm-season crop',
          'Rainfall above 450 mm — critical at germination, flowering, and pod-forming stages',
          'Dry weather needed for ripening — rain at harvest ruins quality',
          'Loamy soils ideal; can do well in sandy soils with good management',
          'Soil pH 5-7 — below 5 affects rhizobium survival',
          'Avoid easily compacted, crust-forming soils — they break emerging seedlings (hypocotyls)',
          'Can tolerate brief waterlogging; sensitive to drought on sandy soils',
          'Good rotation with maize, cotton, and wheat',
        ]},
        { type: 'callout', text: 'Sandy soils dry out fastest. If your area has sandy soils, drought tolerance and irrigation planning matter more than anywhere else.' },
        { type: 'h', text: 'Variety selection — the checklist' },
        { type: 'p', text: 'When supporting farmers to choose a variety, work through:' },
        { type: 'list', items: [
          'Growing season fit (4 to 4.5 months for most varieties)',
          'Highest documented yield for that agroclimatic zone',
          'Lodging resistance — especially if combine harvesters are used',
          'Long period between physiological maturity and pod shattering',
          'High pod clearance — reduces harvest losses for combine-harvested crops',
          'Disease resistance — particularly red leaf blotch, frog eye, and soybean rust',
        ]},
        { type: 'h', text: 'Common varieties in Solidaridad\'s network' },
        { type: 'value', title: 'TIKOLORE', text: 'Malawi and Zambia. 120-140 days to maturity. Potential 2,500 kg/ha. Tolerant of rust. Promiscuous variety — works with indigenous rhizobia, so inoculation may not be needed if soy was grown in the last 3 years.' },
        { type: 'value', title: 'WAMINI (TGx 1740-2F)', text: 'Mozambique. 90 days to maturity. Potential 3,000 kg/ha. Promiscuous variety. Susceptible to leaf caterpillar, leaf beetle, and mites (mites also vector rust).' },
        { type: 'value', title: 'TGx 1835-10E', text: 'Mozambique. 120-140 days to maturity. Potential 3,000 kg/ha. Tolerant of aphids and grasshoppers.' },
        { type: 'h', text: 'Seed quality' },
        { type: 'p', text: 'Seed quality describes the potential performance of a seed — genetic and physical purity plus health status. Certified seed is non-negotiable for serious production. Without it, yields and crop quality decline rapidly.' },
        { type: 'list', items: [
          'Certified seed manages disease, vigour, and genetic purity risks',
          'Ensures traceability — needed for RTRS, EUDR, and premium markets',
          'Insurance and credit access often require certified seed',
          'Without a steady seed supply, programmes collapse',
        ]},
        { type: 'highlight', text: 'Variety choice is a one-time decision per season. Get it right.' },
      ],
    },
    {
      id: 'soy-land',
      title: 'Module 3 — Land Preparation & Mechanization',
      content: [
        { type: 'p', text: 'Soil is the foundation of soy production. Whether prepared by hoe, oxen, or tractor, the principles are the same: build a healthy seedbed, conserve moisture, and protect against erosion.' },
        { type: 'h', text: 'Land selection' },
        { type: 'list', items: [
          'Avoid land previously cropped to tobacco — residues affect soy',
          '10 m boundary between different soy seed varieties (for seed crops)',
          'Loose, well-drained soils rich in organic matter',
          'Clear dry weeds from September for early planting',
          'Ridges prepared by September, spaced 75 cm apart, with flat surfaces for double-row planting',
        ]},
        { type: 'h', text: 'Understanding soil' },
        { type: 'p', text: 'Soils support plant growth, control water movement, recycle organic matter, provide habitat for soil organisms, influence atmospheric composition, and underpin the built environment. For agriculture, the key functions are nutrient supply and water-holding capacity — both shaped by soil structure.' },
        { type: 'h', text: 'Two tillage systems' },
        { type: 'pathway', title: 'CONVENTIONAL TILLAGE', text: 'Aims to produce a fine, deep, firm seedbed. Land is ploughed, disked, and harrowed. Pulverises soil structure, exposes soil to erosion, and creates a plough pan over time. Higher fuel and labour costs.' },
        { type: 'pathway', title: 'CONSERVATION TILLAGE', text: 'Tillage only where strictly needed. Furrows opened for seed and fertiliser; rest of soil left undisturbed. At least 30% of soil surface remains covered with residue (zero-till leaves 70%+ residue).' },
        { type: 'h', text: 'Why conservation tillage matters' },
        { type: 'stat', number: '60-90%', label: 'Reduction in soil erosion', detail: 'From conservation tillage compared to conventional methods' },
        { type: 'stat', number: '3-7 years', label: 'Time to see yield benefit', detail: 'Soil structure improvement is slow — the patience is part of the practice' },
        { type: 'list', items: [
          'Crop residues shield soil from rain and wind until canopy closes',
          'Organic matter improves water infiltration, reducing runoff',
          'Lower fuel, labour, and machinery costs',
          'Reduced soil compaction over time',
          'Frees women\'s time where labour shortages are gendered',
        ]},
        { type: 'callout', text: 'Conservation tillage often increases herbicide reliance — that trade-off needs to be designed for, not ignored.' },
        { type: 'h', text: 'Mechanization options' },
        { type: 'pathway', title: 'ANIMAL TRACTION', text: 'Cattle, donkeys, mules. Affordable, available, timely. Used for ploughing, planting, weeding, transport, water pumping, and powering threshing/milling machines. Provides manure for fertility.' },
        { type: 'pathway', title: 'TRACTORS & IMPLEMENTS', text: 'Higher capacity, higher cost. Right-sized match between tractor and equipment, maintenance, and operator training are the keys to efficient use. Annual calibration before harvest is essential.' },
        { type: 'h', text: 'Caring for draught animals' },
        { type: 'list', items: [
          'Do not overwork; rest frequently during work',
          'Check harness fit and condition daily — avoid sharp edges and wire repairs',
          'Supplement feed beyond grass when needed; never feed from the ground',
          'Provide fresh water and shelter',
          'Watch for ticks, worms, and stones in feet',
          'Use breeching straps on cart-pulling animals',
        ]},
        { type: 'highlight', text: 'Mechanization is right-sized to the farmer. Don\'t sell a tractor where a yoke works.' },
      ],
    },
    {
      id: 'soy-planting',
      title: 'Module 4 — Planting & Crop Nutrition',
      content: [
        { type: 'p', text: 'Planting and crop nutrition are tightly linked — the moment seed enters soil sets the trajectory for the season. Inoculation, fertilisation, and seed depth all happen in the same operation.' },
        { type: 'h', text: 'Planting time' },
        { type: 'list', items: [
          'Plant when seedbed has adequate moisture — never dry plant',
          'Wait until rains are well established to avoid post-planting dry spells',
          'Early plantings cause excessive vegetative growth and lodging without yield benefit',
          'Late plantings give insufficient vegetative growth, low pod height, and low yield',
          'Plant in morning or evening — direct sunlight kills inoculant',
        ]},
        { type: 'callout', text: 'NEVER DRY PLANT SOYBEANS. This is the single most common cause of crop failure in smallholder soy.' },
        { type: 'h', text: 'Inoculation' },
        { type: 'p', text: 'Soybean fixes its own nitrogen via Rhizobium bacteria that form nodules on the roots. Inoculation seeds these bacteria onto the seed. Two variety types matter here:' },
        { type: 'pathway', title: 'SPECIFIC VARIETIES', text: 'Require specific rhizobia strain. Must be inoculated where soy hasn\'t been planted in the last three years.' },
        { type: 'pathway', title: 'PROMISCUOUS VARIETIES', text: 'Associate with multiple rhizobia. Tikolore (Malawi) and Wamini (Mozambique) are promiscuous. If soy was planted in the last 3 years, inoculation may not be needed.' },
        { type: 'h', text: 'The inoculation procedure' },
        { type: 'list', items: [
          'Put seed in plastic pail (one 50 g pack treats 10-15 kg seed)',
          'Weigh 5-10 g sugar as a sticker',
          'Mix sugar in 200 ml water (about three-quarters of a 300 ml bottle)',
          'Add sugary water to seed, then inoculant, mix until seed is coated',
          'Spread on tarpaulin in shade for 30 min to dry',
          'Plant within 24 hours — sunlight kills the rhizobia',
        ]},
        { type: 'h', text: 'Basal fertiliser' },
        { type: 'p', text: 'On poor-to-medium fertility soils, fertiliser sustains the crop for the first six weeks before effective nodulation. Soybean needs phosphorus at planting — SSP or Compound L work well. Recommended rates:' },
        { type: 'list', items: [
          '150-200 kg of Compound L per hectare, OR',
          '200-250 kg of Single Super Phosphate (SSP) per hectare',
          'Gypsum can also be applied as basal',
          'Soybean responds well to manure application',
          'Always use soil analysis to refine rates',
        ]},
        { type: 'h', text: 'The four Rs of fertiliser' },
        { type: 'value', title: 'RIGHT SOURCE', text: 'Match fertiliser type to crop need — soy needs phosphorus at planting more than nitrogen.' },
        { type: 'value', title: 'RIGHT TIME', text: 'Apply when crop needs nutrients — basal at planting; top-dress only if visibly deficient.' },
        { type: 'value', title: 'RIGHT RATE', text: 'Based on soil test and plant demand — over-application wastes money and pollutes.' },
        { type: 'value', title: 'RIGHT PLACE', text: '10-15 cm below or beside the seed, never in direct contact (causes seed burn and kills the inoculant).' },
        { type: 'h', text: 'Planting depth and method' },
        { type: 'list', items: [
          'Plant 2-3 cm deep — too deep kills emerging seedlings',
          'Fertiliser in furrow first, covered with 2 cm soil, then inoculated seed',
          'Cover seed immediately — if left exposed, sunlight kills the rhizobia',
          'For better yields: apply both inoculant and fertiliser between the two rows in a ridge',
          'If surface crusting occurs before emergence, dampen with irrigation or break the crust gently',
        ]},
        { type: 'highlight', text: 'Get planting right and you\'ve removed 80% of the things that cause yield loss.' },
      ],
    },
    {
      id: 'soy-csa',
      title: 'Module 5 — Climate-Smart Soy Agriculture',
      content: [
        { type: 'p', text: 'Climate change is reshaping soy production — unpredictable rainfall, droughts, floods, new pest pressures, and rising temperatures. Climate-Smart Agriculture (CSA) is Solidaridad\'s framework for responding without sacrificing productivity.' },
        { type: 'h', text: 'Climate change in plain terms' },
        { type: 'p', text: 'Climate change is a shift in weather patterns linked to human activity — primarily fossil fuel use, deforestation, intensified agriculture, and waste. For farmers, the impacts are direct:' },
        { type: 'list', items: [
          'Increased temperatures and unpredictable rainfall',
          'Intense droughts and floods',
          'New pest and disease pressures',
          'Increased disease prevalence (malaria, diarrhoea)',
          'Soil erosion and water contamination',
        ]},
        { type: 'h', text: 'The three pillars of CSA' },
        { type: 'pathway', title: 'ADAPTATION', text: 'Adjustments in behaviours and systems to reduce risk to lives and livelihoods. For soy: drought-tolerant varieties, drip irrigation, planting-time shifts.' },
        { type: 'pathway', title: 'MITIGATION', text: 'Actions to lower greenhouse gas emissions — by storing carbon in soil and biomass or reducing emissions. For soy: reduced tillage, cover crops, biochar, reduced synthetic fertiliser.' },
        { type: 'pathway', title: 'PRODUCTIVITY', text: 'Output per unit area. CSA must not sacrifice productivity — practices need to do all three or be part of a portfolio that does.' },
        { type: 'callout', text: 'A good CSA practice does at least two of the three. The best do all three.' },
        { type: 'h', text: 'Practical CSA practices for soy' },
        { type: 'value', title: 'WATER MANAGEMENT', text: 'Drip irrigation (slow, low-evaporation), furrow irrigation, water-retention structures. Critical in drought-prone areas.' },
        { type: 'value', title: 'CONSERVATION TILLAGE', text: 'Minimum disturbance, soil organic matter builds over time, protects against floods and droughts. Needs 3-7 years to show yield benefit.' },
        { type: 'value', title: 'COVER CROPS & MULCHING', text: 'Reduces erosion, retains moisture, suppresses weeds. Mulch increases infiltration; cover crops can be part of an agroforestry system.' },
        { type: 'value', title: 'INTERCROPPING', text: 'Soy as a short-duration legume fits well in intercropping and rotations. Addresses nitrogen and water stress.' },
        { type: 'value', title: 'REDUCED SYNTHETIC FERTILISER', text: 'Compost and manure plus precise micro-dosing of synthetic fertiliser. 100 kg P/ha compost can outperform higher chemical rates.' },
        { type: 'value', title: 'CLIMATE-RESILIENT VARIETIES', text: 'Earlier-maturing, drought-tolerant, waterlogging-tolerant. Variety diversification is itself an adaptation practice.' },
        { type: 'value', title: 'INTEGRATED PEST MANAGEMENT', text: 'Reduced pesticide, biological controls, seed treatment, minimum tillage — all help manage pests without chemical reliance.' },
        { type: 'value', title: 'BIOCHAR', text: 'Stores carbon, retains nutrients, improves yields. High mitigation potential plus productivity gains.' },
        { type: 'h', text: 'The trade-off matrix' },
        { type: 'p', text: 'Few practices score positive on all three pillars. The CSA framework helps farmers and field staff make explicit trade-offs:' },
        { type: 'list', items: [
          'Irrigation: positive for productivity and adaptation, neutral for mitigation',
          'Conservation tillage: neutral productivity (initially), positive adaptation and mitigation',
          'Mulching: positive on all three pillars',
          'Reduced synthetic N: variable productivity, positive adaptation and mitigation',
          'Optimised synthetic N: positive productivity and adaptation, variable mitigation',
        ]},
        { type: 'highlight', text: 'CSA is not a fixed prescription. It\'s a way of choosing — making the trade-offs visible.' },
      ],
    },
    {
      id: 'soy-protection',
      title: 'Module 6 — Weed, Pest & Disease Management',
      content: [
        { type: 'p', text: 'Inefficient weed control is one of the main causes of low soy yields. Add pests and diseases — many of which arrive only after deforestation and climate change disrupt natural balances — and crop protection becomes a sustained, layered effort across the season.' },
        { type: 'h', text: 'Weed control' },
        { type: 'p', text: 'Soy is sensitive to weed competition during the first six weeks. Weeds compete for water, nutrients, light, and space.' },
        { type: 'pathway', title: 'MANUAL CONTROL', text: 'Hoeing within 2 weeks of planting, then again at 5-6 weeks. Effective for small farms with available labour. Avoid weeding immediately after rain.' },
        { type: 'pathway', title: 'CHEMICAL CONTROL', text: 'Pre-emergence herbicides (immediately after planting) and post-emergence herbicides (after both crop and weeds germinate). Match herbicide to predominant weed species.' },
        { type: 'pathway', title: 'CULTURAL CONTROL', text: 'Production practices that establish the crop early — proper seed placement, planting date, seeding rates. The crop then out-competes most weeds.' },
        { type: 'callout', text: 'Early weed control matters most. Late weeding loses the yield battle even if the field looks clean by harvest.' },
        { type: 'h', text: 'Common soy pests' },
        { type: 'list', items: [
          'Caterpillars (soybean looper, leaf miners, leaf rollers) — vegetative stage damage to leaves',
          'Termites — attack roots and stems, worse in dry rain-fed conditions',
          'Pod-sucking bugs — attack from flowering onwards, reduce seed quality',
          'Beetles, aphids, mites — secondary but can vector viruses',
        ]},
        { type: 'callout', text: 'Soybean tolerates up to 30% defoliation without yield loss. Below that threshold, leaf damage doesn\'t justify spraying.' },
        { type: 'h', text: 'Common soy diseases' },
        { type: 'pathway', title: 'SOYBEAN RUST (FUNGAL)', text: 'Tan to dark brown lesions; pustules on lower leaf surface. Up to 80% yield loss. Worse in high rainfall, late planting. Control: Carbendazim/Flusilazole or Triadimenol fungicides; timely planting.' },
        { type: 'pathway', title: 'FROG EYE LEAF SPOT (FUNGAL)', text: 'Brown circular spots with grey centres on leaves. Control: resistant varieties, crop rotation, clean seed.' },
        { type: 'pathway', title: 'DAMPING-OFF & ANTHRACNOSE', text: 'Seed-borne fungal diseases. Kills seedlings or causes brown sunken cankers. Control: certified seed, fungicidal seed treatments (Apron Star).' },
        { type: 'pathway', title: 'BACTERIAL BLIGHT & WILDFIRE', text: 'Watersoaked angular lesions, yellow halos. Spreads in windy rainstorms. Control: resistant varieties, clean seed, avoid wet-field cultivation.' },
        { type: 'pathway', title: 'SOYBEAN MOSAIC VIRUS', text: 'Spread by aphids, beetles, whiteflies, and infected seed. Mosaic patterns, leaf distortion, stunting. Control: virus-free seed, early planting, rogue affected plants.' },
        { type: 'h', text: 'Safe pesticide use' },
        { type: 'list', items: [
          'Use only chemicals registered for soybean',
          'Follow label instructions for rates, timing, and pre-harvest intervals',
          'Wear protective equipment — gloves, mask, long sleeves',
          'Wash hands thoroughly after handling',
          'Never store chemicals near food',
          'Never eat from spoons used to measure chemicals',
        ]},
        { type: 'h', text: 'The IPM principle' },
        { type: 'p', text: 'Integrated Pest Management combines biological, cultural, mechanical, and chemical controls — using chemicals only when economic damage thresholds are crossed. It is both more sustainable and more cost-effective than spraying on schedule.' },
        { type: 'highlight', text: 'A 30% defoliation tolerance means most leaf damage isn\'t worth spraying for. Walk the field before reaching for the sprayer.' },
      ],
    },
    {
      id: 'soy-harvest',
      title: 'Module 7 — Harvesting & Post-Harvest Management',
      content: [
        { type: 'p', text: 'A good crop can be destroyed in the last weeks. Harvesting too early, drying poorly, or storing badly can each turn a successful season into a write-off. Post-harvest losses in smallholder soy regularly exceed 30% — and almost all of it is preventable.' },
        { type: 'h', text: 'When to harvest' },
        { type: 'p', text: 'Soybean is ready for harvest 100-150 days after planting, depending on variety. The indicators:' },
        { type: 'list', items: [
          'Days-to-maturity for the variety has been reached',
          'Pods produce a rattling sound when shaken',
          'Defoliation — 90% of leaves dropped or yellowed',
          'Most lower leaves dropped, upper leaves yellowing',
          'Beans inside pods feel firm but not hard',
        ]},
        { type: 'callout', text: 'Harvest too early and the crop moulds in storage. Harvest too late and pods shatter, losing grain to the ground.' },
        { type: 'h', text: 'Hand harvesting process' },
        { type: 'list', items: [
          'Cut plants just above ground level — do not pull by roots (the nitrogen-fixing nodules benefit the next crop)',
          'Harvest in the morning to avoid shattering',
          'Dry on mats, plastic sheets, tarpaulins, or raised platforms',
          'Thresh gently on a clean surface when fully dry',
          'Dry threshed grain for 2 sunny days',
          'Test dryness: grain should crack or break when bitten, not bend',
          'Clean: winnow to remove chaff; remove shrivelled, broken, or off-variety grains',
          'Never mix varieties during harvest',
        ]},
        { type: 'h', text: 'Critical loss points' },
        { type: 'p', text: 'Solidaridad\'s post-harvest research identifies three critical loss points in smallholder soy:' },
        { type: 'stat', number: '13.9%', label: 'Field drying & harvesting losses', detail: 'Lodging, rodents, termites, late harvesting, late rains causing rotting and sprouting' },
        { type: 'stat', number: '9.4%', label: 'Storage losses', detail: 'Insect pests, theft, termites, rodents, fungal infestation, grain discolouration' },
        { type: 'stat', number: '7.2%', label: 'Homestead drying losses', detail: 'Wildlife and domestic animal damage, rain spoilage, shattering and spillage' },
        { type: 'h', text: 'Storage technologies' },
        { type: 'value', title: 'HERMETIC BAGS', text: 'Multi-layer polythene bags with gas barrier (PICS triple bags are the best known). Low oxygen, elevated CO2 — insects suffocate. 50 kg to 3 tonne capacity. Vulnerable to rodent damage, so combine with good rodent management.' },
        { type: 'value', title: 'METAL SILOS', text: 'Galvanized iron cylindrical structures, hermetically sealed. Insect-proof, theft-proof, rodent-proof. Long-life, low maintenance, no chemicals needed. Higher upfront cost.' },
        { type: 'value', title: 'IMPROVED GRANARY', text: 'Raised platform on a foundation, with proper walls, roof, and compartments. Easy to build with local materials. Protects against pests, vermin, fire, and theft when designed correctly.' },
        { type: 'h', text: 'Good storage practices' },
        { type: 'list', items: [
          'Clean storage room — remove all old grain and insects',
          'Stack bags on raised platforms or wooden pallets, not on the floor',
          'Inspect monthly — remove infested or rotting grains',
          'Optional treatment with Actellic Super, or coat grain with edible oil or ash',
          'Bags must be washed and disinfected (boiled 5 min) before reuse',
        ]},
        { type: 'highlight', text: 'Reducing post-harvest losses by even half is often more valuable than increasing field yields. It\'s the cheapest yield gain on the farm.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Soy Field Scenarios',
    scenarios: [
      {
        situation: 'A new field officer asks when to do inoculation before planting. They suggest doing it the day before and storing the treated seed in a sealed container by the window so it dries faster.',
        options: [
          { text: 'Approve the plan — drying faster is good.', correct: false, feedback: 'Direct sunlight (UV light) kills rhizobia bacteria. Even one day in a sunlit window destroys the inoculant.' },
          { text: 'Recommend inoculating within 24 hours of planting, drying in shade for about 30 minutes, then planting in early morning or late afternoon to avoid direct sunlight on the treated seed.', correct: true, feedback: 'Correct. UV light kills rhizobia. 24-hour window from inoculation to planting, shade-drying, and morning/evening planting are all about protecting the bacteria the crop will depend on for nitrogen.' },
          { text: 'Tell them inoculation is optional and they can skip it.', correct: false, feedback: 'Inoculation is critical for specific varieties and for any field that hasn\'t grown soy in the last 3 years. Skipping it can cut yields in half.' },
        ],
      },
      {
        situation: 'A cooperative leader pushes for planting two weeks before the rains arrive, arguing that early planting will give a head start on weed growth and lengthen the growing season.',
        options: [
          { text: 'Agree — early planting always means more time for growth.', correct: false, feedback: 'NEVER dry-plant soybeans. Without adequate soil moisture, seed will fail to germinate, or germinate weakly and die in the first dry spell. Early planting and dry planting are not the same thing.' },
          { text: 'Push back firmly — never dry-plant soybean. Seed needs adequate moisture to germinate. Wait until the rains are well established, then plant immediately. Early-maturing varieties or staggered planting can give the "head start" effect safely.', correct: true, feedback: 'Correct. Dry planting is the single most common cause of complete soy crop failure in smallholder systems. The solution to "we want more growing season" is variety choice, not gambling with the rains.' },
          { text: 'Compromise — plant one week before rains.', correct: false, feedback: 'Still dry planting. The rule isn\'t about timing relative to expected rains — it\'s about actual soil moisture. One week early is still a coin flip.' },
        ],
      },
      {
        situation: 'A farmer in your project reports yields of 0.6 t/ha while a neighbouring commercial farm achieves 3 t/ha on the same soil type. The farmer says the soil must be the problem.',
        options: [
          { text: 'Recommend a soil amendment programme as the primary intervention.', correct: false, feedback: 'Soil amendments may help, but the 5x yield gap between smallholder and commercial soy is almost never primarily about soil. Practices come first.' },
          { text: 'Walk through the practice basics first — variety choice, planting time, inoculation, basal fertiliser, weeding timing, harvest timing, and post-harvest losses. The yield gap of 0.6 vs 3 t/ha is almost always in practices, not soils. Soil testing is useful but secondary.', correct: true, feedback: 'Correct. Smallholder yields of 0.6 t/ha against a potential of 3-4 t/ha are driven by practice gaps. Diagnose practices first, soil second. The same soil that gives 3 t/ha commercially can give 3 t/ha smallholder with the right methods.' },
          { text: 'Suggest the farmer switch to a different crop.', correct: false, feedback: 'Defeatist and unnecessary. The farmer has a 5x yield gap that\'s almost certainly closable with practice change. Switching crops abandons that opportunity.' },
        ],
      },
      {
        situation: 'A farmer says she will use her own saved seed for the third consecutive season. Last year\'s yield was 30% lower than the first year. She wants to avoid the cost of certified seed.',
        options: [
          { text: 'Support farm-saved seed indefinitely — it\'s a cost saving and farmer autonomy matters.', correct: false, feedback: 'The 30% yield decline IS the cost. Cheap seed is rarely the cheapest seed when you account for lost yield.' },
          { text: 'Explain the yield trade-off — saved seed loses vigour and genetic purity each generation. The 30% decline she\'s already seen will continue. Even one season of certified seed every 2-3 years would recover the lost yield. Connect her to local seed multipliers and any subsidy programmes available.', correct: true, feedback: 'Correct. Saved seed is a false economy on soy specifically — both genetic decline and disease build-up reduce yields faster than most farmers expect. Replacement on a 2-3 year rotation is a common compromise.' },
          { text: 'Insist she must use certified seed every season or leave the programme.', correct: false, feedback: 'Heavy-handed and ignores legitimate budget constraints. A phased plan respects the farmer\'s situation while addressing the underlying problem.' },
        ],
      },
      {
        situation: 'A farmer doesn\'t want to adopt practices that don\'t directly increase his yield this season. He\'s sceptical of conservation tillage because the benefits take years to appear.',
        options: [
          { text: 'Drop conservation tillage from the recommendations.', correct: false, feedback: 'This is what gender-sensitive but not gender-transformative looks like — accepting a constraint instead of working with it. Conservation tillage has long-term value worth advocating for.' },
          { text: 'Acknowledge the timeline honestly. Show the trade-off matrix — conservation tillage offers immediate erosion protection and lower labour/fuel costs (this-season wins), with yield benefits arriving in years 3-7. Pair with mulching (positive across all three CSA pillars from year one) for faster, visible wins.', correct: true, feedback: 'Correct. Don\'t oversell the practice. Be honest about timelines, then point to companion practices (mulching, cover crops) that deliver short-term wins. The whole CSA portfolio matters more than any single practice.' },
          { text: 'Mandate the practice without explanation.', correct: false, feedback: 'Adults don\'t respond well to mandates without rationale — and field staff who issue them lose credibility fast.' },
        ],
      },
      {
        situation: 'A farmer reports 15% storage losses using jute bags in a mud-walled granary. He\'s open to changing but unsure what to do.',
        options: [
          { text: 'Recommend selling immediately at harvest to avoid storage altogether.', correct: false, feedback: 'Forcing immediate sale gives the farmer no price negotiation power and locks in the worst-price moment of the year (harvest glut). Storage is the solution, not avoidance.' },
          { text: 'Move to hermetic storage — PICS triple bags or a metal silo if budget allows. Combine with rodent control, raised platforms, monthly inspection, and pre-storage grain treatment (Actellic Super or edible oil/ash coating). 15% loss is preventable.', correct: true, feedback: 'Correct. Hermetic storage cuts insect losses to near zero. Combined with the other practices (raised platforms, rodent control), 15% loss can drop to under 2%. That is more valuable per hectare than most yield-boosting interventions.' },
          { text: 'Recommend chemical fumigation only.', correct: false, feedback: 'Fumigation alone is risky (especially with food grain) and doesn\'t address the underlying storage condition. Hermetic storage solves the problem more permanently.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'The two soybean growth habit types are:', options: ['Tall and short', 'Determinate and indeterminate', 'Annual and perennial', 'Native and exotic'], answer: 1 },
    { q: 'Minimum rainfall required for good soy yields:', options: ['Below 200 mm', '200-400 mm', 'Above 450 mm', 'Above 1000 mm only'], answer: 2 },
    { q: 'Optimum soil pH range for soybean:', options: ['3-4', '5-7', '8-10', 'Any pH'], answer: 1 },
    { q: 'The rule on dry planting soybeans is:', options: ['Always preferred — avoids fungal disease', 'Never dry plant — wait for adequate soil moisture', 'Only acceptable in sandy soils', 'Acceptable if seed is inoculated'], answer: 1 },
    { q: 'Soybean fixes nitrogen via:', options: ['Photosynthesis', 'Rhizobium bacteria forming root nodules', 'Direct absorption from air', 'Synthetic fertiliser application'], answer: 1 },
    { q: 'A 50 g pack of inoculant treats approximately:', options: ['1-2 kg of seed', '10-15 kg of seed', '100 kg of seed', '500 kg of seed'], answer: 1 },
    { q: 'Inoculated seed must be planted within:', options: ['1 hour', '24 hours', '1 week', '1 month'], answer: 1 },
    { q: 'Recommended planting depth for soy:', options: ['0-1 cm', '2-3 cm', '8-10 cm', '15-20 cm'], answer: 1 },
    { q: 'Recommended basal fertiliser rate for Single Super Phosphate (SSP):', options: ['10-20 kg/ha', '200-250 kg/ha', '500-600 kg/ha', '1000 kg/ha'], answer: 1 },
    { q: 'Conservation tillage reduces soil erosion by approximately:', options: ['5-10%', '20-30%', '60-90%', '99%'], answer: 2 },
    { q: 'The three pillars of Climate-Smart Agriculture are:', options: ['Land, labour, capital', 'Adaptation, mitigation, productivity', 'Plant, animal, soil', 'Inputs, outputs, profit'], answer: 1 },
    { q: 'Soybean defoliation threshold below which spraying is not justified:', options: ['Up to 5%', 'Up to 30%', 'Up to 70%', 'Up to 100%'], answer: 1 },
    { q: 'Soybean rust can cause yield losses of up to:', options: ['5%', '20%', '80%', '100% in all conditions'], answer: 2 },
    { q: 'The largest critical loss point in smallholder soy post-harvest is:', options: ['Storage (9.4%)', 'Homestead drying (7.2%)', 'Field drying & harvesting (13.9%)', 'Transport'], answer: 2 },
    { q: 'For areas where soy hasn\'t been planted in 3+ years, the safest variety choice is:', options: ['Any saved seed', 'A specific variety requiring its own rhizobia strain', 'A promiscuous variety like Tikolore or Wamini, with proper inoculation', 'Any variety — soil bacteria are always present'], answer: 2 },
  ],
});



// ===== Commodity courses (built from Solidaridad ECA training materials) =====

COURSES.push({
  id: 'coffee',
  title: 'Coffee: Agronomy, Quality & Climate',
  subtitle: 'Growing, processing and quality across Arabica and Robusta',
  category: 'Commodities',
  icon: commodityIcon(coffeeIcon),
  duration: '1 hr 20 min',
  description: 'A seven-module working summary of Solidaridad ECA\'s coffee curriculum, drawing on the Tanzania National Coffee Sustainability Curriculum, the UCDA Robusta Coffee Handbook, and Solidaridad\'s climate-smart, organic, nursery business-case, and waste-to-wealth (biochar) materials. Designed for staff who support field teams, partner cooperatives, and farmer training programmes across Arabica and Robusta systems.',
  lessons: [
    {
      id: 'coffee-overview',
      title: 'Module 1 — Coffee & Solidaridad\'s Coffee Work',
      content: [
        { type: 'p', text: 'Coffee is one of Solidaridad\'s flagship ECA commodities — a high-value export crop and the main cash income for hundreds of thousands of smallholder families across Ethiopia, Kenya, Uganda, and Tanzania. This course is a working summary of the regional coffee curriculum staff use to support field teams and cooperatives.' },
        { type: 'h', text: 'The two coffees' },
        { type: 'pathway', title: 'ARABICA (Coffea arabica)', text: 'High-altitude crop, 1,000-2,500 MASL, 1,500-2,000 mm rainfall, ideal 15-25 degrees C. Distinct body and flavour; fetches a premium. Self-pollinating. Usually wet (washed) processed.' },
        { type: 'pathway', title: 'ROBUSTA (Coffea canephora)', text: 'Lower-altitude crop, from about 800-1,500 MASL, 1,500-3,000 mm rainfall, 24-30 degrees C. Cross-pollinated, hardier, higher caffeine, heavier body. Usually dry (natural) processed. In Kagera it grows under banana shade.' },
        { type: 'h', text: 'Why coffee matters in ECA' },
        { type: 'list', items: [
          'Africa produces about 11% of world coffee; Ethiopia, Uganda, Cote d\'Ivoire, Tanzania, and Kenya are the five largest African producers',
          'In Tanzania, about 90% of coffee comes from roughly 320,000 smallholders averaging 200 trees on 0.5-2 acre plots',
          'World demand is rising — driven by emerging economies and growing specialty markets for sustainably produced coffee',
          'Because of its export value, coffee is a regulated crop — growing, processing, and marketing must meet standards set by national boards',
        ]},
        { type: 'h', text: 'The yield gap' },
        { type: 'stat', number: '4,800-6,000 kg/ha', label: 'Potential cherry yield, improved compact Arabica', detail: 'TaCRI compact varieties (TaCRI 1F-6F) at close spacing under good management' },
        { type: 'stat', number: '~1,000 kg/ha', label: 'Traditional variety / poorly managed average', detail: 'Old, unpruned, under-fertilised trees — the gap is mostly practice, not potential' },
        { type: 'callout', text: 'As with soy, the yield gap is the opportunity. Old trees, poor pruning, weak soil fertility, and pest neglect — not the crop itself — drive low smallholder yields. Closing that gap is what good extension support delivers.' },
        { type: 'h', text: 'How Solidaridad supports coffee' },
        { type: 'p', text: 'Solidaridad works across the chain — building agronomy capacity through Good Agricultural Practices (GAPs), strengthening nurseries and cooperatives, advancing climate-smart and low-carbon production, and creating new income through certification and the biochar carbon-removal programme. The curriculum harmonises national materials (TaCRI, TCB, UCDA) with Solidaridad\'s sustainability framing.' },
        { type: 'pathway', title: 'CERTIFICATION & VSS', text: 'Voluntary Sustainability Standards (Fairtrade, Rainforest Alliance, organic, 4C, C.A.F.E. Practices) reward environmental, social, and economic sustainability with market access and premiums. Certification and verification underpin specialty and EUDR-ready supply.' },
        { type: 'pathway', title: 'COOPERATIVES & AMCOS', text: 'Most smallholders sell through cooperatives, AMCOS, or farmer associations. Collective processing and bulking lift quality and bargaining power — but only if every member delivers good cherry (see Module 7).' },
        { type: 'pathway', title: 'CLIMATE & CARBON', text: 'Coffee zones are getting hotter and drier; suitable Arabica area is shrinking. Solidaridad pairs climate-smart agronomy with the biochar carbon-removal programme, turning farm waste into a soil amendment and a new revenue stream (Module 6).' },
        { type: 'pathway', title: 'FAMILY BUSINESS', text: 'The curriculum treats the farm as a business — record keeping, enterprise budgeting, break-even price and yield — and as a household enterprise that deliberately engages women and youth across the value chain.' },
        { type: 'highlight', text: 'Coffee is a perennial, long-game crop. Decisions made at establishment — variety, spacing, shade — shape income for decades.' },
      ],
    },
    {
      id: 'coffee-establishment',
      title: 'Module 2 — Farm Establishment, Varieties & the Nursery Business Case',
      content: [
        { type: 'p', text: 'Coffee is planted once and harvested for 20-40 years. Getting establishment right — land assessment, variety, spacing, planting holes, and quality seedlings — is the single highest-leverage thing a farmer ever does. Staff should support these decisions with real care.' },
        { type: 'h', text: 'Know your farm — land assessment' },
        { type: 'list', items: [
          'Soil: friable loamy/clay soils, depth over 1.5 m for Arabica (over 1 m for Robusta), good drainage',
          'Soil pH: Arabica 4.5-6.5, Robusta 4.5-7.0 — pH below 4.5 or above 7 hinders growth and nutrient uptake',
          'Water: Arabica needs roughly 800-2,500 mm, Robusta 1,200-3,000 mm, well distributed; harvest rainwater on terraces where there are no streams',
          'Terrain: assess slope; build contour terraces, bunds, grass strips, and cut-off drains on slopes to stop erosion',
          'Shade: coffee is an agroforestry crop — moderate shade regulates temperature, breaks wind, and adds nutrients',
          'Altitude: matches the crop type — high for Arabica, medium for Robusta',
        ]},
        { type: 'callout', text: 'Never burn cleared vegetation unless it is diseased. It is a valuable resource for firewood, compost, and mulch — and burning harms the environment. Hand-pick perennial weeds instead.' },
        { type: 'h', text: 'Variety choice — improved beats traditional' },
        { type: 'p', text: 'Improved varieties grow faster, yield far more, and resist (some, not all) major diseases. Compact Arabica hybrids are propagated by seed; tall Arabica hybrids and Robusta are multiplied vegetatively (cuttings, grafting, tissue culture) so they are genetically identical to the mother plant.' },
        { type: 'value', title: 'IMPROVED COMPACT ARABICA', text: 'TaCRI 1F, 3F, 4F, 6F. Close spacing (2 x 1.5 m to 2 x 2 m), 2,500-3,333 plants/ha, potential 4,800-6,000 kg/ha cherry. Resistant to Coffee Berry Disease and Coffee Leaf Rust.' },
        { type: 'value', title: 'IMPROVED TALL ARABICA', text: 'N39 and KP423 hybrid series. Spacing 2 x 2.5 m to 2.74 x 2.74 m, 1,330-2,000 plants/ha, good cup quality. Disease tolerance varies by line.' },
        { type: 'value', title: 'IMPROVED ROBUSTA', text: 'Maruku 1 & 2, Bukoba 1, Muleba 1. Spacing 3 x 3 m, about 1,110 plants/ha (Robusta is taller and bushier). Yields up to 2,400-3,900 kg/ha for the best lines. Use Robusta rootstock where root-knot nematodes are a problem.' },
        { type: 'callout', text: 'Seedlings must come from a registered, certified nursery (TaCRI/TCB or equivalent). Self-collected seedlings from fallen berries carry disease and lose varietal purity — a poor choice of seedling means weak trees and low productivity for decades.' },
        { type: 'h', text: 'Planting holes and planting out' },
        { type: 'list', items: [
          'Dig holes in the dry season: 60 cm deep x 60 cm wide x 60 cm long',
          'Heap topsoil (first 30 cm) on the uphill side, subsoil (next 30 cm) on the downhill side, kept separate',
          'At least one month before planting, mix topsoil with 100 g DAP/TSP/rock phosphate plus well-decomposed manure or compost; refill the hole and cover with subsoil',
          'Plant at the start of the long rains; first plant shade trees or banana to shelter young seedlings',
          'Pull the polythene sheath, straighten or trim an over-long taproot, firm the soil, then irrigate with at least 5 L and mulch',
          'Ring-mulch young coffee for the first three years; keep mulch off the stem to deny pests a bridge',
        ]},
        { type: 'h', text: 'The nursery as a business case' },
        { type: 'p', text: 'A coffee nursery is not just a production unit — it is a viable agribusiness for a cooperative, youth group, or individual. It supplies certified, disease-resistant seedlings locally, supports varietal conversion, and reduces dependence on distant suppliers. Solidaridad staff increasingly help partners run nurseries as enterprises.' },
        { type: 'list', items: [
          'Site: clean water access, well-drained soil, gentle slope, accessible to farmers',
          'Layout: water source, seedbed, potting area, shaded nursery (75% then 50% shade), hardening zone, dispatch',
          'Potting media ratio: 3:2:1 topsoil : sand : manure, using sterilised soil',
          'Production cycle: germination 6-8 weeks, transplant to polybags at 8-10 weeks, ready for sale at 8-10 months',
          'Quality assurance: certified seed/scions, labelling and traceability, remove weak/diseased seedlings, standardise size at sale',
        ]},
        { type: 'stat', number: '~30%', label: 'Profit margin in an illustrative nursery', detail: 'Example: 3,000 seedlings, cost about KES 83,000, revenue about KES 270,000 — a production cost near KES 9 per seedling sold around KES 30' },
        { type: 'highlight', text: 'Establishment and variety choice are one-time, decades-long decisions. A certified seedling in a well-prepared hole is the cheapest investment a farmer ever makes.' },
      ],
    },
    {
      id: 'coffee-gaps',
      title: 'Module 3 — Good Agricultural Practices: Pruning, Nutrition & Soil',
      content: [
        { type: 'p', text: 'Good Agricultural Practices (GAPs) are the year-round activities — done at the right time in the regional coffee calendar — that keep trees healthy and productive. Unpruned, under-fed, weedy trees are low-yielding and disease-prone. Pruning and nutrition are where most of the annual income is won or lost.' },
        { type: 'h', text: 'Weeding and soil-water conservation' },
        { type: 'list', items: [
          'Keep the farm weed-free — weeds compete for water and nutrients and harbour pests and disease',
          'Weed with minimum soil disturbance to protect shallow coffee roots; remove weeds before they seed',
          'Leave cut weeds on the ground as mulch or compost; avoid herbicides where possible (they harm young coffee and the environment)',
          'Mulch with banana trash, coffee husk/pulp, maize stover, or Napier grass, dried first, 4-9 inches thick, never touching the stem',
          'Use contour ploughing, terraces, and trenches to trap rainwater and stop erosion',
        ]},
        { type: 'h', text: 'Pruning and canopy management' },
        { type: 'p', text: 'Canopy management is one of the most critical factors for yield and bean quality. Arabica is usually trained as single or double stems; Robusta as a multi-stem system (2-4 stems). Always use sharp secateurs or a saw for clean cuts, and seal large wounds with bituminous paint or fungicide to prevent rot.' },
        { type: 'value', title: 'CAPPING', text: 'When a young tree reaches about 70 cm, cap to 50 cm, always 5 cm above a node (never at it). Pairs of suckers grow at the node; select the best, remove the rest.' },
        { type: 'value', title: 'FIRST PRUNING', text: 'Gives the tree its basic shape — select uniform axial shoots and remove crisscrossing primaries from the centre to open the tree to light and air, encouraging flowering.' },
        { type: 'value', title: 'ANNUAL / MAIN PRUNING', text: 'Done immediately after harvest, before flowering. Remove exhausted branches that bore the previous crop and young suckers between primaries to concentrate energy on productive wood. Robusta branches that fruited will not fruit again.' },
        { type: 'value', title: 'HANDLING', text: 'Through the rainy season, remove excess new growth and select the bearing branches; this controls pests and lets sprays penetrate.' },
        { type: 'value', title: 'BENDING (ROBUSTA)', text: 'The Kagera "Agobiada" system: bend established Robusta branches to one side and peg down to trigger new upright shoots on the sun-exposed side.' },
        { type: 'value', title: 'STUMPING', text: 'Complete rejuvenation of aged trees by cutting back the main stem(s). Done every 7-9 years; stage it across the farm so harvest is never fully interrupted.' },
        { type: 'callout', text: 'Remove all branches touching the ground — they bridge ants and scale insects up into the canopy. And never let mulch touch the stem, for the same reason.' },
        { type: 'h', text: 'Crop nutrition — the nutrients coffee needs' },
        { type: 'list', items: [
          'Primary macronutrients: Nitrogen (photosynthesis, new tissue), Phosphorus (roots, bud initiation), Potassium (berry size, quality, stress tolerance)',
          'Secondary macronutrients: Magnesium (chlorophyll), Sulphur (disease resistance, cupping quality), Calcium (cell structure, berry quality)',
          'Micronutrients: Boron (flowering, pollen), Copper (acts as a fungicide), Zinc (flower initiation, cherry development)',
        ]},
        { type: 'h', text: 'Integrated Soil Fertility Management (ISFM)' },
        { type: 'p', text: 'ISFM combines organic sources (manure, compost, coffee-husk compost, green manure) with judicious inorganic fertiliser, guided by soil and leaf analysis. TaCRI rates rise with tree age — for example SA/NPK from about 75 g/tree in year 0 to 215 g/tree by year 4, with DAP only at planting. Get a soil analysis every 2-3 years to match product and rate to the deficiency.' },
        { type: 'value', title: 'RIGHT PRODUCT', text: 'Match fertiliser to the deficiency the soil/leaf test reveals — an acidifying programme on already-acid soil is a costly mistake.' },
        { type: 'value', title: 'RIGHT RATE', text: 'Follow age-based rates and test results; over-application causes excessive vegetative growth and wastes money.' },
        { type: 'value', title: 'RIGHT TIME', text: 'Apply in line with growth stage and rainfall so nutrients are taken up, not leached away.' },
        { type: 'value', title: 'RIGHT PLACE', text: 'Place in the root zone, not against the stem; incorporate organic matter where roots can reach it.' },
        { type: 'callout', text: 'Wrong fertiliser application can damage the crop or cause useless vegetative growth and economic loss. Inorganic fertiliser alone does not feed soil life or add organic matter — pair it with compost and mulch.' },
        { type: 'highlight', text: 'Prune after every harvest and feed by age and soil test. A well-pruned, well-fed tree is the difference between 1,000 and 5,000 kg/ha.' },
      ],
    },
    {
      id: 'coffee-protection',
      title: 'Module 4 — Pests, Diseases & Safe Agrochemical Use',
      content: [
        { type: 'p', text: 'Coffee is attacked by many pests and diseases that can ruin yield and quality. Regular scouting catches problems early, when control is cheap and effective; left to infest, the damage can be irreparable. Integrated Pest Management (IPM) — biological, cultural, and physical controls, with chemicals only when thresholds are crossed — is both safer and more cost-effective than spraying on schedule.' },
        { type: 'h', text: 'Major pests' },
        { type: 'pathway', title: 'COFFEE BERRY BORER', text: 'A beetle whose larvae bore into and feed on the bean — can cause total yield loss. Control: timely, complete harvesting (remove all berries), field hygiene, and pre-berry-stage sprays where justified.' },
        { type: 'pathway', title: 'WHITE COFFEE STEM BORER', text: 'Larvae ring-bark and tunnel the stem, causing yellowing, wilting, and tree death. Control: phytosanitary pruning and de-suckering, scout and kill adult beetles by hand, wire out larvae, plug tunnels (cotton + kerosene or Chlorpyrifos), and prune for light (beetles are drawn to bright stems).' },
        { type: 'pathway', title: 'BLACK COFFEE TWIG BORER', text: 'Bores stressed twigs; wilting terminal leaves are easily mistaken for Coffee Wilt Disease. Control: clean weeding, remove and burn infested twigs; imidacloprid or chlorpyrifos where needed.' },
        { type: 'pathway', title: 'ANTESTIA BUG, MEALYBUGS, SCALES, THRIPS, NEMATODES', text: 'Sap-feeders and root pests that cut quality and vigour. Mulching, manuring, and conserving natural enemies suppress them; avoid quick-knockdown sprays that kill beneficials. Plant nematode-resistant Robusta rootstock on infested land.' },
        { type: 'h', text: 'Major diseases' },
        { type: 'pathway', title: 'COFFEE BERRY DISEASE (CBD)', text: 'Fungus Colletotrichum kahawae. Sunken dark patches on expanding berries; can affect up to 90% of the crop, worst at high altitude in cool, humid conditions. Control: resistant varieties, proper pruning and hygiene, approved systemic fungicides on susceptible old varieties.' },
        { type: 'pathway', title: 'COFFEE LEAF RUST (CLR)', text: 'Fungus Hemileia vastatrix. Yellow-orange pustules on the underside of leaves, premature leaf fall, dieback. Spread by wind and rain. Control: resistant varieties, good GAPs, recommended fungicides timed to weather and berry stage.' },
        { type: 'pathway', title: 'COFFEE WILT DISEASE (CWD / Fusarium)', text: 'Mainly Robusta. The fungus lives deep in the plant and soil — there is no cure (called "coffee AIDS"). Leaves yellow and curl, branches blacken, the trunk base cracks and the wood goes blue-black. Control is prevention only: quarantine, careful pruning to avoid wounds, and uproot-and-burn affected trees on the spot — never move them across the farm.' },
        { type: 'callout', text: 'There is no cure for Coffee Wilt Disease. The only defence is strict quarantine and uprooting and burning affected trees where they stand. Educate farmers near affected zones — stopping movement of infected material is the whole game.' },
        { type: 'h', text: 'Safe use of agrochemicals' },
        { type: 'list', items: [
          'Use only products registered for coffee and approved by the national authority; follow label rates, timing, and pre-harvest intervals',
          'Read labels carefully; wear full PPE — gloves, mask, long sleeves',
          'Pregnant women and children must not spray',
          'Store chemicals safely, away from food and out of children\'s reach; never eat from spoons used to measure chemicals',
          'Manage spray drift and protect water bodies, soil, animals, and beneficial insects',
          'Keep spray records and read the field first — scout, then decide whether spraying is even justified',
        ]},
        { type: 'highlight', text: 'Scout before you spray. IPM keeps pest populations below economic damage, protects beneficial insects, and saves the farmer money.' },
      ],
    },
    {
      id: 'coffee-csa',
      title: 'Module 5 — Climate-Smart, Low-Carbon & Organic Coffee',
      content: [
        { type: 'p', text: 'Coffee zones are getting hotter and drier — suitable Arabica area is shrinking across ECA. Climate-Smart Agriculture (CSA) is Solidaridad\'s framework for responding without sacrificing yield, and low-carbon and organic production turn that response into market and carbon value.' },
        { type: 'h', text: 'The three pillars of CSA' },
        { type: 'pathway', title: 'ADAPTATION', text: 'Reduce risk to the crop and household: drought-tolerant varieties, shade and windbreaks, water harvesting and irrigation, planting-time shifts, income diversification.' },
        { type: 'pathway', title: 'MITIGATION', text: 'Cut or store greenhouse gases: agroforestry and shade trees as carbon sinks, reduced tillage, cover crops, compost over synthetic N, and biochar (Module 6).' },
        { type: 'pathway', title: 'PRODUCTIVITY', text: 'CSA must keep output up. A good practice does at least two of the three pillars; the best — like agroforestry, mulching, and biochar — do all three.' },
        { type: 'h', text: 'Practical climate-smart practices for coffee' },
        { type: 'value', title: 'AGROFORESTRY & SHADE', text: 'Combine coffee with leguminous shade trees (Albizia, Grevillea, Cordia, Ficus, Leucaena) at 10-20 m spacing. They regulate microclimate, fix nitrogen, cut erosion, redistribute water, and provide fuel, fodder, and fruit. Choose deep-rooted, umbrella-canopy species that do not compete with coffee\'s surface roots.' },
        { type: 'value', title: 'SOIL & WATER CONSERVATION', text: 'Terraces, trenches, contour planting (plant along the contour on slopes over 5%), Vetiver and grass barriers, and drainage canals to control runoff and improve infiltration on sloping Arabica land.' },
        { type: 'value', title: 'COVER CROPS & GREEN MANURE', text: 'Mucuna, Canavalia, and Lablab cover bare soil, fix nitrogen, suppress weeds, and add carbon. Incorporate before they seed.' },
        { type: 'value', title: 'REGENERATIVE PRINCIPLES', text: 'Keep the soil covered, minimise disturbance, maintain living roots, and maximise biodiversity. The aim is to regenerate soil health, not just sustain it.' },
        { type: 'value', title: 'INTEGRATED PEST MANAGEMENT', text: 'Reduced pesticide reliance protects beneficial insects and lowers cost and emissions (see Module 4).' },
        { type: 'callout', text: 'There is no single "best" adaptation. Solutions depend on the site — altitude, slope, rainfall, soil. Help farmers assess their own situation and trial options before committing.' },
        { type: 'h', text: 'The carbon-footprint angle' },
        { type: 'p', text: 'A coffee farm\'s carbon footprint is the total greenhouse gas emitted across production and on-farm processing, expressed as CO2-equivalent. The big sources are synthetic fertiliser, fossil-fuel use, and methane from wet-processing wastewater and anaerobic waste. Low-carbon practice cuts these while afforestation, cover crops, and biochar remove carbon — and can link farmers to carbon markets.' },
        { type: 'h', text: 'Organic coffee' },
        { type: 'p', text: 'Organic production builds fertility through compost, manure, mulch, and agroforestry, manages pests and disease without synthetic inputs, and earns certification premiums. A few rules matter for staff supporting organic farmers:' },
        { type: 'list', items: [
          'Rooting hormones are not allowed in organic seedling production',
          'Compost is best applied in the planting holes of young seedlings',
          'Do not use coffee husks of unknown origin as input — they can carry disease',
          'Where Arabica at a given altitude is heavily hit by rust and berry borer despite good management, that is a signal the site suits Robusta better',
          'Always cross-check inputs against the applicable organic standard before recommending them',
        ]},
        { type: 'highlight', text: 'Shade trees are the keystone climate-smart practice for coffee — adaptation, mitigation, and productivity in one. Plan them in at establishment.' },
      ],
    },
    {
      id: 'coffee-waste',
      title: 'Module 6 — Waste to Wealth: Biochar & the Carbon Programme',
      content: [
        { type: 'p', text: 'Coffee farms generate large volumes of biomass — prunings, husks, pulp, maize stalks. Burned or left to rot, that waste sends carbon to the atmosphere and earns nothing. Solidaridad\'s biochar carbon-removal programme turns it into a soil amendment, a fertility boost, and a new income stream. This is the "waste to wealth" model staff promote to farmers and service providers.' },
        { type: 'h', text: 'What biochar is' },
        { type: 'p', text: 'Biochar is a carbon-rich, porous, charcoal-like material made by pyrolysis — heating biomass to high temperature in an oxygen-limited environment so it decomposes without burning. About 60-80% of the biochar\'s mass is carbon that stays locked in the soil for over 100 years. Crucially, pyrolysis is NOT combustion: in pyrolysis roughly half the carbon is fixed in the char and about half the biomass energy is released as usable heat.' },
        { type: 'list', items: [
          'Feedstock must be sustainably sourced — farm residues and wastes, never wood from forests (that drives deforestation)',
          'Exclude contaminated material (paint, tar, glue, heavy metals like lead, arsenic, cadmium)',
          'Aim for feedstock moisture around 15-20% entering the kiln; above 40-50% there is not enough energy to pyrolyse',
          'Simple kilns work: flame-cap "Kon-Tiki" or top-lit open burns let smallholders make good char from prunings and husks',
          'Quench or cover the hot char quickly to stop it burning to ash',
        ]},
        { type: 'h', text: 'Why biochar works in soil' },
        { type: 'list', items: [
          'Raises soil pH and cation exchange capacity (CEC) — the soil holds more nutrients',
          'Improves nutrient availability (nitrogen, phosphorus), water-holding capacity, and soil structure',
          'Provides habitat for soil microbes and boosts microbial activity',
          'Stores carbon long-term — the basis of carbon-removal credits',
        ]},
        { type: 'callout', text: 'Never apply raw, fresh biochar alone — it can rob the soil of nutrients first. Charge it: mix with manure, compost, or nutrient-rich solution (or quench it in nutrient water in the kiln) so it arrives loaded, then apply in the future root zone.' },
        { type: 'h', text: 'How to apply biochar' },
        { type: 'list', items: [
          'Mix with fertiliser, compost, or manure before applying — apply biochar amendment each crop cycle',
          'Place in the root zone — planting holes, banding, or topsoil mixing for established trees',
          'Avoid dust loss: dampen the char and avoid applying in high wind',
          'Co-compost biochar with farm biomass, or bury in trenches to build soil carbon and store water',
        ]},
        { type: 'h', text: 'The carbon-removal programme' },
        { type: 'p', text: 'Farmers join by committing not to burn residues, not sourcing biomass from forests, signing a collaboration agreement, and tracking biomass collection, biochar production, and application on a smartphone. Solidaridad and partners use part of the credit value to fund training, production services, digital tracking, and certification.' },
        { type: 'stat', number: '2,000 kg to 500 kg', label: 'Biomass to dry biochar', detail: 'Roughly 2,000 kg of biomass converts to about 500 kg of dry biochar' },
        { type: 'stat', number: '~1 credit', label: 'Per 500 kg dry biochar', detail: 'About one carbon-removal credit = one tonne of CO2 sequestered' },
        { type: 'stat', number: 'USD 50+/tCO2', label: 'Minimum farmer price per credit', detail: 'Paid once the biochar is produced and applied and the flows are tracked; actual prices may rise with the market' },
        { type: 'h', text: 'Other coffee by-products' },
        { type: 'p', text: 'Beyond biochar, coffee husks and pulp make excellent compost and mulch (dried first), and pyrolysis produces wood vinegar (pyroligneous acid) that can aid germination, pest control, and foliar feeding. The principle is the same: nothing on a coffee farm needs to be wasted.' },
        { type: 'highlight', text: 'Waste to wealth: residues that were burned for free now build soil, cut emissions, and pay the farmer. Burning biomass forfeits all three.' },
      ],
    },
    {
      id: 'coffee-harvest',
      title: 'Module 7 — Harvesting, Processing, Quality & Marketing',
      content: [
        { type: 'p', text: 'Post-harvest handling decides most of the final quality — and most of the price. A good crop in the field can be ruined in the days after picking. Staff should treat harvest and processing as carefully as agronomy.' },
        { type: 'stat', number: '~60%', label: 'Of green-bean quality is set after harvest', detail: 'Pulping, fermentation, drying, hulling, sorting, grading, and storage — the "ten commandments" of processing' },
        { type: 'h', text: 'Good harvesting' },
        { type: 'list', items: [
          'Improved varieties start bearing 18 months after planting (traditional ~36 months)',
          'Pick only ripe red cherries; visit the farm every 10-14 days as cherry ripens',
          'Selective picking (multiple passes) for Arabica protects quality; strip picking is used for Robusta',
          'Sort for uniform ripeness — process under-ripe, over-ripe, diseased, and pest-infested cherry separately as second-grade',
          'Weigh and record each harvest to track yield and farm profitability',
        ]},
        { type: 'callout', text: 'Pulp cherry the same day it is picked — never let it sit more than 8 hours. Fermentation begins immediately, especially in warm weather, and destroys the quality of the green bean.' },
        { type: 'h', text: 'Primary processing' },
        { type: 'pathway', title: 'WET / WASHED (Arabica)', text: 'Pulp the day of picking, ferment 24-36 hours until mucilage washes off, wash with plenty of clean water (floaters off the top), then dry to about 10.5% moisture. Done at home with a hand pulper or — preferably — at a Central Processing Unit (CPU) for uniform quality. Needs lots of clean water.' },
        { type: 'pathway', title: 'DRY / NATURAL (Robusta)', text: 'Dry whole cherries on raised patios, raking and turning, for 10-14 days to 11-12% moisture. Cheaper and water-light; gives lower acidity and a heavier body. Standard for Robusta.' },
        { type: 'pathway', title: 'HONEY PROCESS', text: 'A middle path — some mucilage left on during drying. Specialty markets pay for distinctive cup profiles.' },
        { type: 'callout', text: 'In collective selling, it is not enough for a few farmers to do well — cross-contamination spoils the whole bulk and lowers the price for everyone. Keep the pulper clean (rotten "stinker" beans cause the worst defects) and never mix coffee pulped on different days in one fermentation tank.' },
        { type: 'h', text: 'Storage and quality' },
        { type: 'list', items: [
          'Store dry parchment/cherry off the ground in clean, dry, ventilated conditions',
          'Defects originate at the farm (poor agronomy), at harvest (under/over-ripe, debris), and during processing (poor pulping, fermentation, drying)',
          'Arabica is graded by bean size and class; quality determines which market and price a lot reaches',
          'Manage processing waste (solid and liquid) so it does not pollute — and route it to compost or biochar (Module 6)',
        ]},
        { type: 'h', text: 'Marketing and farming as a business' },
        { type: 'p', text: 'Coffee can be sold as dried Kiboko (Robusta), FAQ, graded coffee for export, or value-added roasted beans. Marketing channels range from farm gate and the auction to direct export and specialty markets. Quality is rewarded and poor quality is punished — undried or poor coffee can cost a farmer 10-15% of value.' },
        { type: 'list', items: [
          'Price is driven by volume, quality, and the market reached — specialty and certified markets pay premiums',
          'Keep records: input costs, harvest weights, sales — the basis for enterprise budgeting and a break-even price and yield',
          'Deliberately engage women and youth — processing and value addition are strong entry points',
          'Diversify income (food crops, banana, fruit, fodder) to manage coffee\'s price and weather risk',
        ]},
        { type: 'highlight', text: 'Quality won in the field is easily lost in the first 8 hours and the drying yard. Same-day pulping, clean processing, and good drying are the cheapest premium a farmer can earn.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Coffee Field Scenarios',
    scenarios: [
      {
        situation: 'A farmer wants to start a new Arabica plot and plans to dig the planting holes and plant seedlings in the same week, just as the rains begin, to save time. He has also collected seedlings from fallen berries under his old trees to avoid nursery costs.',
        options: [
          { text: 'Approve — planting holes and seedlings together at the rains is efficient.', correct: false, feedback: 'Holes must be dug in the dry season and prepared at least one to two months before planting so the topsoil/manure/phosphate mix settles and the soil is right when roots arrive. Same-week digging skips that.' },
          { text: 'Advise digging 60 cm cubic holes in the dry season, filling them with topsoil mixed with manure/compost and 100 g phosphate at least a month ahead, and sourcing certified seedlings from a registered nursery — not self-collected ones.', correct: true, feedback: 'Correct. Prepared holes settle before planting, and certified nursery seedlings guarantee varietal purity and disease freedom. Seedlings from fallen berries carry disease and lose varietal quality — weak trees for decades.' },
          { text: 'Approve the holes but support using the self-collected seedlings to keep costs down.', correct: false, feedback: 'The seedling is the cheapest input over a 30-year tree life. Self-collected seedlings undermine the whole plot. Connect the farmer to a registered nursery instead.' },
        ],
      },
      {
        situation: 'A cooperative\'s Robusta trees are 45 years old, badly overgrown, and yields have collapsed. A board member proposes uprooting and replanting the entire farm at once next season.',
        options: [
          { text: 'Support full replanting of the whole farm in one season.', correct: false, feedback: 'Trees over 40-50 years are often best replanted rather than rehabilitated — but doing the whole farm at once means zero income during establishment. Stage it.' },
          { text: 'Recommend assessing tree age and health, then staging the work — stump or replant in phases over several seasons so harvest continues, and check whether stumping (for younger trees) or replanting (for very old ones) fits each block.', correct: true, feedback: 'Correct. Stumping rejuvenates trees younger than ~40 years; very old trees warrant replanting. Either way, phase it across the farm so the household keeps an uninterrupted income.' },
          { text: 'Advise heavier fertiliser on the old trees instead of stumping or replanting.', correct: false, feedback: 'Fertiliser cannot fix 45-year-old exhausted trees. The structural problem is the canopy and tree age — rejuvenation, not more inputs, is the answer.' },
        ],
      },
      {
        situation: 'During a farm visit you see several Robusta trees with yellowing, curling leaves, blackened branches, and vertical cracks at the base of the trunk with blue-black wood underneath. The farmer wants to know which fungicide to buy.',
        options: [
          { text: 'Recommend a strong systemic fungicide programme to save the trees.', correct: false, feedback: 'These are classic Coffee Wilt Disease symptoms. The fungus lives deep in the plant and soil — there is no cure, and the fungicide volumes needed would be uneconomic and environmentally harmful.' },
          { text: 'Identify likely Coffee Wilt Disease, advise uprooting and burning affected trees on the spot (never moving them across the farm), tightening quarantine and careful wound-free pruning, and alerting neighbours and the local agricultural office.', correct: true, feedback: 'Correct. CWD has no cure. Control is prevention only: uproot and burn in place, quarantine, avoid wounding healthy trees, and stop any movement of infected material — especially near unaffected zones.' },
          { text: 'Tell the farmer it is probably nutrient deficiency and recommend foliar feed.', correct: false, feedback: 'The trunk cracking and blue-black wood are diagnostic of CWD, not deficiency. Misdiagnosis lets the disease spread. Treat it as CWD and act on quarantine immediately.' },
        ],
      },
      {
        situation: 'A farmer reports about 25% defoliation from leaf miners on his Arabica during the vegetative stage and wants to spray a fast-acting broad-spectrum insecticide across the whole farm immediately.',
        options: [
          { text: 'Recommend immediate blanket spraying with the quick-knockdown product.', correct: false, feedback: 'Quick-knockdown broad-spectrum products wipe out the beneficial insects and natural enemies that keep pests like thrips and miners in check, often making the next outbreak worse. This is the opposite of IPM.' },
          { text: 'Scout the farm to confirm the pest and its level, lean on cultural controls (pruning for light, hygiene, conserving natural enemies, mulching) and only use a registered, selective product on hot spots if a real threshold is crossed.', correct: true, feedback: 'Correct. IPM means scout first, use cultural and biological controls, and reserve targeted, registered chemicals for genuine economic thresholds — protecting beneficials and the farmer\'s budget.' },
          { text: 'Tell the farmer to do nothing — coffee always recovers from leaf damage.', correct: false, feedback: 'Doing nothing ignores a real pest. The right answer is to assess and respond proportionately with IPM, not to dismiss it.' },
        ],
      },
      {
        situation: 'A farmer has been burning his coffee prunings and maize stalks every season. He has heard about the biochar programme but worries that making char is "just burning" and that applying it will hurt his soil.',
        options: [
          { text: 'Agree it is risky and advise him to keep composting only.', correct: false, feedback: 'This misses a real opportunity. Pyrolysis is not burning — it locks carbon in the char — and charged biochar improves soil while earning carbon income. Composting and biochar are complementary, not either/or.' },
          { text: 'Explain that pyrolysis (in a flame-cap kiln) is oxygen-limited, not combustion; that biochar must be charged with manure/compost before applying to the root zone; and that joining the programme means not burning, tracking the biomass, and earning at least USD 50 per tonne of CO2.', correct: true, feedback: 'Correct. Pyrolysis fixes ~60-80% of the char as stable carbon, charged biochar lifts pH, CEC, and water-holding, and the programme pays for tracked production and application. Burning forfeits the soil benefit, the emissions saving, and the income.' },
          { text: 'Tell him to apply fresh biochar straight to the soil to get started quickly.', correct: false, feedback: 'Raw, uncharged biochar can temporarily rob the soil of nutrients. It must be charged with manure, compost, or nutrient solution first, then placed in the root zone.' },
        ],
      },
      {
        situation: 'At a cooperative wet mill, members deliver cherry late in the afternoon and some leave it in sacks overnight before pulping the next morning. A few members also process their own at home with dirty water. Quality complaints and price discounts are rising.',
        options: [
          { text: 'Accept the overnight holding as unavoidable and focus only on the home processors.', correct: false, feedback: 'Holding cherry overnight is a primary cause of the problem. Fermentation starts within hours and ruins the bean; this must be fixed alongside the home-processing issue.' },
          { text: 'Enforce same-day pulping (cherry never held over 8 hours), keep the pulper clean and never mix different days\' coffee in one tank, and bring home processors into the CPU so the whole bulk has uniform quality.', correct: true, feedback: 'Correct. Same-day pulping, clean equipment, and collective CPU processing protect quality. In collective selling, a few poor lots cross-contaminate the bulk and discount everyone\'s price — uniformity is the cooperative\'s shared asset.' },
          { text: 'Advise selling all the coffee immediately as second-grade to avoid the quality argument.', correct: false, feedback: 'Dumping everything as second-grade locks in the lowest price and abandons the premium the cooperative could earn. Fix the process instead — the gains are large and cheap.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'Arabica coffee grows best at altitudes of approximately:', options: ['Sea level to 500 MASL', '500-900 MASL', '1,000-2,500 MASL', 'Above 3,000 MASL only'], answer: 2 },
    { q: 'Compared with Arabica, Robusta is generally:', options: ['Higher altitude and self-pollinating', 'Lower altitude, cross-pollinated, and hardier', 'Lower in caffeine and lighter-bodied', 'Always wet processed'], answer: 1 },
    { q: 'Recommended planting hole dimensions for coffee are about:', options: ['20 x 20 x 20 cm', '60 x 60 x 60 cm', '100 x 100 x 100 cm', '30 cm deep, any width'], answer: 1 },
    { q: 'Why must seedlings come from a registered, certified nursery?', options: ['It is cheaper than self-collection', 'To guarantee varietal purity and freedom from disease', 'Because the law requires irrigation', 'Certified seedlings need no shade'], answer: 1 },
    { q: 'Annual (main) pruning of coffee should be done:', options: ['Just before harvest', 'Immediately after harvest, before flowering', 'In the middle of the rainy season only', 'Every five years'], answer: 1 },
    { q: 'Stumping to rejuvenate aged coffee trees is typically done every:', options: ['1-2 years', '7-9 years', '20 years', 'Only once in the tree\'s life'], answer: 1 },
    { q: 'Coffee Wilt Disease (CWD) in Robusta is best managed by:', options: ['Systemic fungicide sprays', 'Heavier fertiliser application', 'Quarantine plus uprooting and burning affected trees on the spot', 'Increasing irrigation'], answer: 2 },
    { q: 'Coffee Berry Disease (CBD) can affect up to what share of the crop if uncontrolled?', options: ['10%', '30%', '50%', '90%'], answer: 3 },
    { q: 'The three pillars of Climate-Smart Agriculture are:', options: ['Land, labour, capital', 'Adaptation, mitigation, productivity', 'Pulping, drying, grading', 'Nitrogen, phosphorus, potassium'], answer: 1 },
    { q: 'Pyrolysis differs from burning because:', options: ['It uses more oxygen', 'It happens in an oxygen-limited environment and fixes carbon in the char', 'It always produces ash', 'It requires no heat'], answer: 1 },
    { q: 'Before applying biochar to soil, it should be:', options: ['Applied fresh and dry on its own', 'Charged by mixing with manure, compost, or nutrient solution', 'Burned again to ash', 'Soaked in herbicide'], answer: 1 },
    { q: 'In the biochar carbon programme, roughly one carbon-removal credit equals:', options: ['100 kg of CO2', '500 kg of dry biochar / about 1 tonne CO2', '10 tonnes of biomass', 'One bag of cherry'], answer: 1 },
    { q: 'After picking, coffee cherry should be pulped within:', options: ['8 hours', '3 days', '1 week', 'Whenever convenient'], answer: 0 },
    { q: 'Post-harvest processing accounts for approximately what share of green-bean quality?', options: ['About 10%', 'About 25%', 'About 60%', 'About 95%'], answer: 2 },
    { q: 'In collective (cooperative) selling, the main quality risk is:', options: ['Too much clean water in wet processing', 'A few poor lots cross-contaminating and discounting the whole bulk', 'Selling roasted instead of green', 'Picking only ripe cherries'], answer: 1 },
  ],
});


COURSES.push({
  id: 'tea',
  title: 'Tea: Leaf, Quality & Livelihoods',
  subtitle: 'Plucking standards, green-leaf factories and women in tea',
  category: 'Commodities',
  icon: commodityIcon(teaIcon),
  duration: '1 hr 10 min',
  description: 'A six-module summary of Solidaridad ECA\'s sustainable tea work, drawing on the Reclaim Sustainability! (RS!) Tea programme in Kenya and Uganda and the Women in Tea report, combined with standard sustainable-tea agronomy. Designed for staff who support field teams, factories, farmer associations, and women-in-tea groups.',
  lessons: [
    {
      id: 'tea-overview',
      title: 'Module 1 — Tea & Solidaridad\'s Tea Work',
      content: [
        { type: 'p', text: 'Tea is one of East and Central Africa\'s most important export commodities and a major employer of rural women. Solidaridad ECA works across the tea value chain — from the smallholder field and the green-leaf factory to national policy and premium export markets. This course summarises that work and the agronomy behind it.' },
        { type: 'h', text: 'Why tea matters' },
        { type: 'list', items: [
          'Major export earner — in Uganda nearly 90% of tea produced is exported to global markets',
          'A leading employer of rural labour, especially women',
          'A perennial crop — once established, a tea bush yields for decades, giving steady year-round income and cash flow',
          'Highly traded through auction systems (notably the Mombasa Tea Auction) where smallholders historically have had little price control',
          'A crop where quality, not just volume, drives the price a farmer receives',
        ]},
        { type: 'h', text: 'The sustainability case' },
        { type: 'p', text: 'The RS! Tea programme (2021-2025), funded by the Netherlands Ministry of Foreign Affairs and led by Solidaridad, aimed to build an inclusive, sustainable and responsible tea value chain in which smallholder farmers and workers — women and men — are meaningfully represented in decision-making, benefit from fair value distribution, enjoy decent work, and produce in environmentally sustainable ways.' },
        { type: 'stat', number: '60,000 t', label: 'Uganda annual tea production', detail: 'Nearly 90% exported to global markets (Women in Tea report)' },
        { type: 'stat', number: 'over 70%', label: 'Share of farm labour done by women in Uganda tea', detail: 'Yet historically excluded from decision-making and value capture' },
        { type: 'callout', text: 'Most smallholder tea is sold as bulk green leaf into auctions where price is set far from the farm. The whole sustainability problem — low prices, weak voice, invisible women — sits in that structure. Solidaridad\'s tea work is about changing it.' },
        { type: 'h', text: 'Solidaridad\'s tea work — the three pathways' },
        { type: 'pathway', title: 'VIBRANT CIVIL SOCIETY', text: 'Strengthen farmer-, worker- and women-led organisations so they can advocate, hold power holders accountable, and shape sector decisions. Examples: WITEVA (Kenya), WiTU and UTOA (Uganda), and national multi-stakeholder platforms.' },
        { type: 'pathway', title: 'RESPONSIBLE PRIVATE SECTOR', text: 'Support inclusive business models (specialty and cottage tea), market transparency, direct buyer linkages, and adherence to voluntary sustainability standards — moving value back toward producers.' },
        { type: 'pathway', title: 'SUPPORTIVE PUBLIC SECTOR', text: 'Influence policy and regulation so the sector\'s rules protect growers and workers. Examples: contributions to Kenya\'s tea regulations and the Uganda National Tea Policy.' },
        { type: 'h', text: 'Key institutions to know' },
        { type: 'list', items: [
          'Kyai Nchi Kenya — legally registered national multi-stakeholder platform for the Kenyan tea sector',
          'Kenya Women in Tea Value Chain Association (WITEVA) — national voice for women in Kenyan tea',
          'National Association of Women in Tea Uganda (WiTU) — women-led CSO spanning 26 tea-producing districts',
          'Uganda Tea Outgrowers Association (UTOA) — legally registered national voice of smallholder tea farmers',
          'KPAWU (Kenya Plantation and Agricultural Workers Union) — partner on living wage and collective bargaining',
        ]},
        { type: 'highlight', text: 'Tea is a perennial, quality-driven, export commodity. The leverage points are the bush, the factory, the price structure, and who gets a voice in the sector.' },
      ],
    },
    {
      id: 'tea-gap',
      title: 'Module 2 — The Tea Bush, Quality & Plucking Standards',
      content: [
        { type: 'p', text: 'Everything in tea begins with the leaf the farmer picks. Tea is processed from the young shoots of the bush, and the single biggest lever a smallholder controls is plucking quality. Get plucking right and the green leaf earns more, processes better, and grades higher. Get it wrong and no factory can recover the value.' },
        { type: 'h', text: 'The fine-leaf standard' },
        { type: 'p', text: 'The classic quality plucking standard is "two leaves and a bud" — the soft, immature shoot. Coarse plucking (taking older leaves and woody stem) lowers the proportion of fine leaf, depresses grade, and reduces the price the factory can pay.' },
        { type: 'list', items: [
          'Pluck the bud plus the top two tender leaves — the fine-leaf fraction',
          'Avoid old, hard, or damaged leaf and woody stalk — these dilute quality',
          'Keep leaf loose, shaded and cool after plucking; never compact it tightly in the bag',
          'Deliver to the factory or buying centre quickly — green leaf deteriorates from the moment it is picked',
        ]},
        { type: 'callout', text: 'Fine-leaf percentage is the quality number that matters at the buying centre. Coarse plucking is the most common, most avoidable cause of low green-leaf prices.' },
        { type: 'h', text: 'Plucking rounds' },
        { type: 'p', text: 'Tea is plucked in repeated rounds as new shoots flush. The plucking round (the interval between harvests of the same bush) is a management decision balancing quality, yield, and labour:' },
        { type: 'list', items: [
          'Shorter rounds capture shoots while still tender — higher quality, more frequent labour',
          'Longer rounds let shoots grow coarse — more weight but lower grade',
          'Rounds tighten in the warm, wet flush season when shoots grow fast, and lengthen in cool or dry periods',
          'A consistent, disciplined round protects quality across the season',
        ]},
        { type: 'h', text: 'Pruning' },
        { type: 'p', text: 'Pruning keeps the bush low, productive, and pluckable. Left unpruned, a tea bush grows into a tree and yield collapses.' },
        { type: 'value', title: 'WHY PRUNE', text: 'Maintains a flat, accessible plucking table at a comfortable height; stimulates new productive shoots; removes old, diseased, and unproductive wood; rejuvenates ageing bushes.' },
        { type: 'value', title: 'HOW & WHEN', text: 'Pruning is done on a cycle of several years. Time it to the bush\'s rest period and local rainfall so the bush recovers with adequate moisture. Prunings are valuable biomass — they can be returned as mulch or converted to biochar.' },
        { type: 'h', text: 'Plucking and the gender reality' },
        { type: 'p', text: 'In ECA tea, plucking and field labour are done overwhelmingly by women — over 70% of farm labour in Uganda. Quality training therefore lands mostly on women, but the income and decisions have historically not. Module 6 returns to this.' },
        { type: 'highlight', text: 'Two leaves and a bud, delivered fresh and cool. That single discipline drives grade, price, and the whole quality story of smallholder tea.' },
      ],
    },
    {
      id: 'tea-agronomy',
      title: 'Module 3 — Good Agricultural Practices: Soil, Fertilisation & Shade',
      content: [
        { type: 'p', text: 'A tea bush is a long-term investment that should yield for decades. Good agricultural practices protect that investment: healthy soil, balanced nutrition, the right shade, and erosion control. These are the practices ECA field staff support most often.' },
        { type: 'h', text: 'Soil and the tea bush' },
        { type: 'list', items: [
          'Tea favours deep, well-drained, acidic soils — it is one of the few crops that thrives in acid conditions',
          'Tea is typically grown in high-rainfall highlands; waterlogging and erosion are the main soil risks',
          'Most ECA tea is grown on slopes — soil and water conservation is not optional',
          'Maintaining soil organic matter sustains yield over the long life of the planting',
        ]},
        { type: 'h', text: 'Fertilisation — right source, time, rate, place' },
        { type: 'p', text: 'Tea is harvested continuously, so it continuously removes nutrients in the plucked leaf. Replacing them keeps yield and quality up. As with all Solidaridad crops, fertilisation follows the four Rs:' },
        { type: 'value', title: 'RIGHT SOURCE', text: 'Match the nutrient to the bush\'s need. Combine organic matter (prunings, mulch, compost, manure) with mineral fertiliser rather than relying on chemicals alone.' },
        { type: 'value', title: 'RIGHT TIME', text: 'Apply when the bush is actively flushing and soil moisture is adequate, so nutrients are taken up rather than lost.' },
        { type: 'value', title: 'RIGHT RATE', text: 'Base rates on soil testing and yield, not habit. Over-application wastes money and acidifies and pollutes; under-application starves the bush.' },
        { type: 'value', title: 'RIGHT PLACE', text: 'Place fertiliser in the root zone under the bush canopy, not on the path or the plucking table, so the bush — not weeds or runoff — gets it.' },
        { type: 'callout', text: 'Inorganic fertiliser is often a farmer\'s single biggest cash cost in tea. Reducing it through organic inputs cuts cost AND emissions — see the biochar evidence in Module 4.' },
        { type: 'h', text: 'Shade trees' },
        { type: 'p', text: 'Well-managed shade trees are part of a resilient tea system, especially as the climate warms:' },
        { type: 'list', items: [
          'Moderate temperature extremes and reduce heat and drought stress on the bush',
          'Add leaf litter and (for leguminous species) fix nitrogen, building soil',
          'Provide an additional product — timber, fruit, or fodder — and store carbon',
          'Must be managed: too much shade depresses yield, so spacing and pruning of shade trees matter',
        ]},
        { type: 'h', text: 'Soil and water conservation on slopes' },
        { type: 'list', items: [
          'Maintain ground cover and mulch between bushes to slow runoff',
          'Use the prunings as in-field mulch rather than removing or burning them',
          'Establish grass strips, contour planting, and drainage on steep blocks',
          'Protect waterways and riparian buffers from fertiliser and agrochemical drift',
        ]},
        { type: 'highlight', text: 'Tea rewards patience. Healthy acid soil, organic matter, balanced nutrition, managed shade, and erosion control protect a planting that should pay for decades.' },
      ],
    },
    {
      id: 'tea-climate',
      title: 'Module 4 — Climate-Smart Tea, Biochar & Living Income',
      content: [
        { type: 'p', text: 'Tea is highly exposed to climate change — it depends on reliable highland rainfall and moderate temperatures, both of which are becoming less predictable. Climate-Smart Agriculture (CSA) is Solidaridad\'s framework for responding without sacrificing productivity, and in ECA tea it has produced some of the programme\'s clearest evidence.' },
        { type: 'h', text: 'The three pillars of CSA' },
        { type: 'pathway', title: 'ADAPTATION', text: 'Adjusting the system to reduce climate risk — shade trees, mulching, soil moisture conservation, drought-tolerant management, and diversified income.' },
        { type: 'pathway', title: 'MITIGATION', text: 'Lowering emissions and storing carbon — reduced inorganic fertiliser, organic inputs, biochar from prunings, and protecting soil carbon.' },
        { type: 'pathway', title: 'PRODUCTIVITY', text: 'Maintaining or raising output and income. A good CSA practice must not cost the farmer yield — the best practices do all three pillars at once.' },
        { type: 'h', text: 'Biochar — the ECA tea evidence' },
        { type: 'p', text: 'Under RS!, Solidaridad piloted low-carbon tea production using biochar made from tea prunings, tested in Western Uganda with Mabale Tea Growers Factory. Biochar improves soil health and nutrient retention, letting farmers cut inorganic fertiliser without losing yield. The pilot produced clear, field-tested results:' },
        { type: 'stat', number: '14%', label: 'Reduction in inorganic fertiliser use', detail: 'From the Uganda biochar tea pilot (RS! Tea report)' },
        { type: 'stat', number: '33%', label: 'Reduction in production costs', detail: 'Driven largely by lower fertiliser spend' },
        { type: 'stat', number: 'over 40%', label: 'Increase in farmer profitability', detail: 'While maintaining or improving yields' },
        { type: 'callout', text: 'Biochar is a rare practice that scores on all three CSA pillars at once: it cuts emissions (mitigation), builds soil resilience (adaptation), and raises profit (productivity). Use the Mabale pilot figures when making the case to farmers and factories.' },
        { type: 'h', text: 'Other climate-smart practices for tea' },
        { type: 'list', items: [
          'Shade-tree integration and agroforestry — cooling, carbon, and diversification',
          'Mulching with prunings — moisture retention, weed suppression, soil organic matter',
          'Reduced and precise inorganic fertiliser, substituted with organic inputs',
          'Soil and water conservation on slopes to manage heavier, less predictable rain',
        ]},
        { type: 'h', text: 'Living wage and living income' },
        { type: 'p', text: 'Sustainable tea is not only environmental — it must be economically decent. In Kenya, Solidaridad and partners established a living wage benchmark in 2022 with Rainforest Alliance and the Kenya Plantation and Agricultural Workers Union (KPAWU). This evidence base let worker representatives negotiate Collective Bargaining Agreements (CBAs) with the Kenya Tea Growers Association.' },
        { type: 'value', title: 'LIVING WAGE (WORKERS)', text: 'What a plantation worker needs to earn for a decent standard of living. A benchmark turns wage talks from guesswork into evidence-based negotiation. Training 150 KPAWU shop stewards on labour law and rights underpinned the signed CBAs.' },
        { type: 'value', title: 'LIVING INCOME (FARMERS)', text: 'What a smallholder household needs from tea (plus other sources) for a decent life. Closing the gap means higher prices, higher quality, value addition, and lower input costs — which is exactly what the specialty/biochar work delivers.' },
        { type: 'highlight', text: 'A practice earns the CSA label when it does at least two of adaptation, mitigation, and productivity. Biochar from tea prunings does all three — and pairs naturally with the living-income goal by cutting cost.' },
      ],
    },
    {
      id: 'tea-market',
      title: 'Module 5 — Factory, Green Leaf & Market Access',
      content: [
        { type: 'p', text: 'Smallholder tea moves from the bush, to the factory as green leaf, to the buyer — historically through opaque auctions. Where staff can help farmers capture more value is in green-leaf quality, factory relationships, certification, and alternative routes to market. This is where much of the RS! private-sector work concentrated.' },
        { type: 'h', text: 'The green-leaf supply chain' },
        { type: 'list', items: [
          'Smallholders deliver green leaf to a buying centre or directly to a processing factory',
          'The factory processes leaf into made tea, most of which is sold in bulk at auction',
          'At the Mombasa Tea Auction, conventional bulk tea can fetch less than USD 1/kg, and prices are broker-dictated — producers have little control',
          'Green-leaf quality (fine-leaf %, freshness) determines the grade and therefore the price the factory can pay back to the farmer',
        ]},
        { type: 'callout', text: 'The auction concentrates the sustainability problem: limited price transparency, weak producer influence, and indirect buyer-seller relationships. Helping producers reach buyers directly is the central market intervention.' },
        { type: 'h', text: 'Green-leaf quality at the factory gate' },
        { type: 'p', text: 'Kenya\'s sector developed formal Green Leaf Quality requirements during the RS! period. The practical message for field staff supporting farmers is consistent:' },
        { type: 'list', items: [
          'Pluck to standard (two leaves and a bud), keep leaf cool and loose, deliver fast',
          'Reject and educate against coarse, contaminated, or fermenting leaf',
          'Consistent quality builds a reliable factory relationship and a better price',
        ]},
        { type: 'h', text: 'Specialty and cottage tea — the disruptive model' },
        { type: 'p', text: 'The flagship RS! private-sector innovation was the specialty and cottage tea business model: small-scale and women-led enterprises process, brand, and export premium teas (purple tea, green tea, black orthodox, specialty blends) under their own labels — bypassing the auction.' },
        { type: 'stat', number: 'under USD 1/kg', label: 'Conventional bulk tea at Mombasa auction', detail: 'The price most smallholders historically receive' },
        { type: 'stat', number: 'USD 20-100/kg', label: 'Specialty tea in niche export markets', detail: 'WiTU exports to the Netherlands, Belgium and the UK (Women in Tea report)' },
        { type: 'p', text: 'In Uganda, women-led enterprises under the Uganda Specialty Tea Network exported consignments directly to European markets at USD 75-120/kg per the RS! report — a radical leap from auction prices. Support came through the International Tea and Coffee Academy (training in production, quality control and tea tasting), digital marketing platforms such as 1,2 Taste, and direct buyer commitments (e.g. Simon Levelt and Lateef in the Netherlands).' },
        { type: 'h', text: 'Certification and voluntary standards' },
        { type: 'pathway', title: 'WHAT CERTIFICATION DOES', text: 'Voluntary sustainability standards (e.g. Rainforest Alliance) signal responsible environmental, social and governance practice and can open premium and compliant markets. They reinforce good agronomy, decent work, and traceability.' },
        { type: 'pathway', title: 'A REAL TENSION', text: 'During RS!, Kenyan sector actors submitted a Challenges Matrix to Rainforest Alliance on the cost and workability of voluntary standards for smallholders — which led to audits being paused pending a solution. Certification is valuable but must be affordable and fair to smallholders. Staff should hold both truths.' },
        { type: 'callout', text: 'A Market Information System (MIS) prototype to broadcast Mombasa auction prices to farmers was built but not fully operationalised — sector actors could not agree on ownership and governance. The lesson: digital transparency tools must be grounded in sector consensus, not pushed ahead of it.' },
        { type: 'highlight', text: 'The fastest way to lift smallholder tea income is to move value off the auction floor: quality green leaf, direct buyer links, and specialty value addition that multiplies the price per kilo.' },
      ],
    },
    {
      id: 'tea-gender',
      title: 'Module 6 — Gender Equity & Women in Tea',
      content: [
        { type: 'p', text: 'Women do the majority of tea\'s farm labour but have historically been excluded from its decisions and its money. The Women in Tea work is not an add-on to Solidaridad\'s tea programme — it is one of its most transformative results. Every field officer should understand it.' },
        { type: 'h', text: 'The starting reality' },
        { type: 'list', items: [
          'Women contribute over 70% of farm labour in Uganda\'s tea sector',
          'Yet decision-making, value addition and profit were dominated by exporters and auction systems far from the community',
          'Women were excluded from policy spaces, concentrated in low-paid work, and disconnected from the value their labour created',
          'Gender-based violence (GBV) in the sector was largely unaddressed',
        ]},
        { type: 'callout', text: 'This is the "invisible backbone" problem: the people doing most of the work hold least of the power and value. Gender equity in tea is about correcting that structural imbalance, not adding a women\'s activity.' },
        { type: 'h', text: 'What the programme built' },
        { type: 'value', title: 'WiTU (UGANDA)', text: 'The National Association of Women in Tea Uganda — a new, legally registered women-led CSO uniting women farmers, workers and processors across 26 tea-producing districts. It moved women from marginalised labourers to policy influencers and specialty tea entrepreneurs.' },
        { type: 'value', title: 'WITEVA (KENYA)', text: 'The Kenya Women in Tea Value Chain Association — formed and strengthened as a national voice for women, with a 5-year strategic plan, its first AGM, and 30 members trained in governance and smart advocacy.' },
        { type: 'value', title: 'UTOA (UGANDA)', text: 'The Uganda Tea Outgrowers Association — legally registered as the national voice of smallholder farmers, with women in active leadership and partnership with WiTU on specialty tea.' },
        { type: 'h', text: 'From labourer to entrepreneur' },
        { type: 'p', text: 'The specialty tea cottage model is the engine of women\'s economic empowerment. Women process, package, and market premium teas under their own brands and export them directly. As WiTU\'s chairperson Julian Nyabuhara put it: "For the first time, women in Uganda\'s tea industry are not only part of the conversation, we are leading it, shaping policies and exporting our own brands."' },
        { type: 'list', items: [
          'Repositioned women as entrepreneurs, exporters and recognised market actors with control over branding, quality and trade',
          'Specialty exports to the Netherlands, Belgium and the UK at USD 20-100/kg versus under USD 1/kg at auction',
          'WiTU members became vocal advocates against GBV, fostering safer workplaces',
          'PACEID (Uganda\'s Presidential Advisory Committee on Exports and Industrial Development) now engages WiTU to replicate the model nationally',
        ]},
        { type: 'h', text: 'From participation to influence — policy' },
        { type: 'p', text: 'The clearest structural win: gender equality was adopted as a core principle in the Uganda National Tea Policy, guaranteeing women a central role in the sector\'s future. In Kenya, trained women leaders contributed to regulatory reforms, gender-responsive policy recommendations, and representative election manuals for the Tea Board of Kenya.' },
        { type: 'h', text: 'What this means for ECA staff' },
        { type: 'list', items: [
          'Treat women\'s tea groups as economic and policy actors, not beneficiaries',
          'Combine grassroots mobilisation with a real business model — organising plus income is what made WiTU durable',
          'Channel quality, processing and market-access training deliberately to women, who do the plucking but have lacked the skills pipeline',
          'Support women\'s leadership in multi-stakeholder platforms and CBA/grievance processes',
          'Take GBV and safe-workplace advocacy seriously as part of the sustainability agenda',
        ]},
        { type: 'highlight', text: 'Equity in tea is not charity — it is a strategic investment in an inclusive value chain. Organise women\'s voice and give it an income base, and they move from invisible labour to leading the sector.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Tea Field & Programme Scenarios',
    scenarios: [
      {
        situation: 'A smallholder is frustrated that his green leaf consistently fetches a low price at the buying centre. He plucks fast, taking three or four leaves and some stalk to maximise weight per day, and stores leaf packed tightly in a sack until the afternoon collection.',
        options: [
          { text: 'Agree that volume is what pays — advise him to pluck even more aggressively to grow the weight delivered.', correct: false, feedback: 'Weight is not the price driver in tea — fine-leaf quality is. Coarse plucking and packing lower the grade, which is exactly why his price is low.' },
          { text: 'Coach him on the two-leaves-and-a-bud standard, keeping leaf loose, shaded and cool, and delivering quickly. Explain that fine-leaf percentage and freshness — not raw weight — set the grade and the price the factory can pay.', correct: true, feedback: 'Correct. Coarse plucking and tight, hot storage are the most common, most avoidable causes of low green-leaf prices. Quality plucking and fast cool delivery lift the grade.' },
          { text: 'Tell him low prices are set at the auction and there is nothing he can do at farm level.', correct: false, feedback: 'Defeatist and wrong. While the auction structure is a real problem, green-leaf quality is squarely within the farmer\'s control and directly affects his price.' },
        ],
      },
      {
        situation: 'A factory and a group of women farmers ask you to recommend a way to cut their fertiliser costs and lower the carbon footprint of their tea, without losing yield. They have plenty of tea prunings available.',
        options: [
          { text: 'Recommend simply cutting fertiliser application by a third to save money.', correct: false, feedback: 'Cutting fertiliser without replacing the nutrients will starve the bush and cut yield. The point of biochar is to maintain nutrition while reducing inorganic input.' },
          { text: 'Point them to the biochar-from-prunings approach proven in the Mabale pilot: it improved soil health and nutrient retention, cut inorganic fertiliser use ~14%, reduced production costs ~33%, and raised profitability over 40% while maintaining yield — adaptation, mitigation and productivity together.', correct: true, feedback: 'Correct. Biochar from tea prunings is a rare all-three-pillars CSA practice. The Mabale pilot gives you field-tested figures to make the case to both farmers and the factory.' },
          { text: 'Tell them carbon footprint is a buyer concern, not a farm concern, and to focus only on yield.', correct: false, feedback: 'This misses both the cost saving and the climate resilience the farmers asked for — and increasingly buyers do require low-carbon evidence.' },
        ],
      },
      {
        situation: 'A women\'s tea group is selling green leaf into the auction system for under USD 1/kg and asks how they can earn meaningfully more. They are organised and willing to learn new skills.',
        options: [
          { text: 'Advise them to simply demand a higher auction price from brokers.', correct: false, feedback: 'Auction prices are broker-dictated and producers have little influence — demanding more rarely works. The leverage is in leaving the bulk auction route for value-added product.' },
          { text: 'Introduce the specialty and cottage tea model: process, brand and export premium tea (e.g. green, purple, orthodox) under their own label. With training in quality and tea tasting and direct buyer links, specialty tea has reached European markets at USD 20-100/kg.', correct: true, feedback: 'Correct. Value addition plus direct market access is the proven route off the auction floor. WiTU women moved from under USD 1/kg to USD 20-100/kg in niche European markets this way.' },
          { text: 'Tell them specialty tea is too advanced for smallholders and they should stay in bulk supply.', correct: false, feedback: 'The Women in Tea results disprove this — marginalised smallholder women became exporters. The model is low-investment and designed for exactly this group.' },
        ],
      },
      {
        situation: 'A donor pushes your team to roll out a digital Market Information System nationally to broadcast auction prices, even though sector actors (Tea Board, traders, factories) have not agreed on who owns or governs the tool.',
        options: [
          { text: 'Build and launch the full system quickly to show results, and sort out governance later.', correct: false, feedback: 'This is precisely the trap RS! avoided. The MIS prototype stalled because ownership and governance were never agreed — launching ahead of consensus risks a dead, contested tool.' },
          { text: 'Develop a prototype and use it to surface the disagreement, but do not push to full rollout until sector actors align on ownership and governance — and document the political-economy lessons either way.', correct: true, feedback: 'Correct. The RS! lesson is explicit: digital transparency tools must be grounded in sector consensus. The prototype usefully exposed power asymmetries even though full rollout was rightly halted.' },
          { text: 'Abandon any work on price transparency since consensus is hard.', correct: false, feedback: 'Too far the other way. Price transparency is a genuine fair-value lever; the prototype generated valuable lessons. The issue is sequencing, not abandoning the goal.' },
        ],
      },
      {
        situation: 'During wage discussions on a tea estate, worker representatives are negotiating against the growers\' association with little hard evidence, relying mainly on demands and counter-demands. They ask how to strengthen their position.',
        options: [
          { text: 'Advise them to simply escalate demands and threaten action until the employer concedes.', correct: false, feedback: 'Escalation without evidence rarely produces durable agreements and can damage the relationship. The RS! approach was evidence-based negotiation.' },
          { text: 'Support them to negotiate from the living wage benchmark established with Rainforest Alliance and KPAWU, and ensure shop stewards are trained in labour law and rights — evidence-based CBAs are what delivered fair-remuneration gains under RS!.', correct: true, feedback: 'Correct. The 2022 living wage benchmark plus trained shop stewards turned wage talks from guesswork into evidence-based bargaining, producing signed CBAs and reducing employer-worker power asymmetry.' },
          { text: 'Tell them wages are set by the market and CBAs cannot change much.', correct: false, feedback: 'The RS! results show otherwise — capacity building and a living wage benchmark produced concrete CBAs and decent-work gains. This advice abandons a working tool.' },
        ],
      },
      {
        situation: 'A field officer plans tea quality and value-addition training and proposes inviting the (mostly male) registered landholders, since "they own the bushes," even though women do almost all the plucking and processing.',
        options: [
          { text: 'Approve the plan — train the registered owners as the legitimate decision-makers.', correct: false, feedback: 'This entrenches the exact exclusion the programme works against: women do over 70% of the labour but are cut out of the skills and value pipeline. Training only landholders wastes the people doing the work.' },
          { text: 'Redesign so women — who do the plucking and processing — are deliberately included and supported into leadership, channelling quality, processing and market-access training to them and linking to WiTU/WITEVA-style groups.', correct: true, feedback: 'Correct. Deliberately channelling skills and market access to women is what moved them from invisible labour to entrepreneurs and policy actors. Equity here is also effectiveness — you are training the people who actually do the work.' },
          { text: 'Run two separate trainings but give women only the basic plucking session and men the business and export content.', correct: false, feedback: 'This reproduces the hierarchy under a veneer of inclusion. The transformative results came precisely from women accessing processing, branding, and export skills — not being capped at plucking.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'The classic quality plucking standard in tea is:', options: ['As many leaves as possible per shoot', 'Two leaves and a bud', 'Only the woody stem', 'The bottom mature leaves'], answer: 1 },
    { q: 'Approximately what share of farm labour in Uganda\'s tea sector is done by women?', options: ['About 20%', 'About 40%', 'Over 70%', 'Under 10%'], answer: 2 },
    { q: 'In the Uganda biochar tea pilot, inorganic fertiliser use was reduced by about:', options: ['1%', '14%', '50%', '90%'], answer: 1 },
    { q: 'The Uganda biochar pilot increased farmer profitability by:', options: ['Under 5%', 'Exactly 14%', 'Over 40%', 'It reduced profitability'], answer: 2 },
    { q: 'Conventional bulk tea at the Mombasa auction typically fetches:', options: ['Under USD 1/kg', 'USD 10/kg', 'USD 50/kg', 'Over USD 100/kg'], answer: 0 },
    { q: 'WiTU specialty teas have reached niche European markets at roughly:', options: ['Under USD 1/kg', 'USD 2-5/kg', 'USD 20-100/kg', 'USD 500/kg'], answer: 2 },
    { q: 'The three pillars of Climate-Smart Agriculture are:', options: ['Land, labour, capital', 'Adaptation, mitigation, productivity', 'Pluck, prune, process', 'Auction, factory, export'], answer: 1 },
    { q: 'Why is pruning essential in tea?', options: ['It increases leaf weight per shoot', 'It keeps the bush low and productive with an accessible plucking table', 'It is required only for certification', 'It replaces the need for fertiliser'], answer: 1 },
    { q: 'In Kenya, the 2022 living wage benchmark was established with:', options: ['The auction brokers alone', 'Rainforest Alliance and KPAWU (workers\' union)', 'Only the government', 'European buyers'], answer: 1 },
    { q: 'WiTU stands for:', options: ['Women in Trade Uganda', 'National Association of Women in Tea Uganda', 'Workers in Tea Union', 'Western Uganda Tea Initiative'], answer: 1 },
    { q: 'The Uganda National Tea Policy notably adopted which as a core principle?', options: ['Auction-only sales', 'Gender equality', 'A ban on smallholders', 'Mandatory chemical fertiliser'], answer: 1 },
    { q: 'Why was the RS! Market Information System (MIS) prototype not fully operationalised?', options: ['It was technically impossible', 'Sector actors could not agree on ownership and governance', 'Farmers refused to use phones', 'It was banned by the government'], answer: 1 },
    { q: 'The main reason coarse plucking lowers a farmer\'s price is that it:', options: ['Adds too much weight', 'Reduces the fine-leaf fraction and lowers the grade', 'Damages the auction system', 'Improves quality but costs more labour'], answer: 1 },
    { q: 'Well-managed shade trees in tea primarily provide:', options: ['No benefit to the bush', 'Temperature moderation, soil organic matter and carbon storage', 'A replacement for plucking', 'Higher auction fees'], answer: 1 },
    { q: 'The specialty and cottage tea model lifts smallholder income mainly by:', options: ['Selling more bulk leaf at the auction', 'Processing, branding and exporting premium tea directly, off the auction floor', 'Reducing plucking quality', 'Eliminating women from the value chain'], answer: 1 },
  ],
});


COURSES.push({
  id: 'fruits-veg',
  title: 'Fruits & Vegetables: Growing, Quality & Markets',
  subtitle: 'Production, food safety and market access',
  category: 'Commodities',
  icon: commodityIcon(fruitsVegIcon),
  duration: '1 hr 15 min',
  description: 'A seven-module summary of Solidaridad ECA\'s sustainable horticulture curriculum, drawn from the FOSEK Fruits, Vegetables & Sweet Potato Production Guide, the Roots of Resilience biodiversity handbook, and the regional horticulture sector strategy. Designed for staff who support field teams, partner cooperatives, and farmer training programmes across the fruit and vegetable value chains.',
  lessons: [
    {
      id: 'fruits-veg-overview',
      title: 'Module 1 — Horticulture & Solidaridad\'s Work',
      content: [
        { type: 'p', text: 'Fruits and vegetables are among the highest-value, most nutrition-rich crops Solidaridad works with. Horticulture generates household income across the year, supplies vitamins and minerals that staple crops cannot, and creates jobs for women and youth along the value chain. This course is a working summary of Solidaridad ECA\'s sustainable horticulture curriculum.' },
        { type: 'h', text: 'Why horticulture matters' },
        { type: 'list', items: [
          'Cash and nutrition together — fruits and vegetables supply vitamins A and C, folic acid, fibre, and antioxidants that combat malnutrition',
          'Year-round income — staggered harvests and diverse crops smooth household cash flow between staple seasons',
          'High value per acre — tomato, cabbage, and avocado can earn many times a cereal crop on the same land',
          'Jobs for women and youth — horticulture value chains are labour-intensive and offer entry points where land and capital are scarce',
          'Fits intercropping — fruits and vegetables side-crop well with coffee, building diversified, resilient farms',
        ]},
        { type: 'h', text: 'The opportunity gap' },
        { type: 'stat', number: '30-40%', label: 'Post-harvest losses', detail: 'Regional estimate of fruit and vegetable produce wasted from poor handling, storage, and cold chain' },
        { type: 'stat', number: '30 t/ha', label: 'Sweet potato potential', detail: 'Against a current smallholder average near 12.5 t/ha — the gap is practices, not the crop' },
        { type: 'callout', text: 'The yield gap and the post-harvest loss gap together are the entire opportunity. Closing them is what good extension support delivers.' },
        { type: 'h', text: 'Where the curriculum comes from' },
        { type: 'p', text: 'This course is built on Solidaridad ECA\'s field materials, including the FOSEK (Food Security through Improved resilience of smallholder farmers in Kenya and Ethiopia) production guide, the Roots of Resilience biodiversity handbook, and regional horticulture sector strategy work. The same methods are applied wherever Solidaridad supports fruit and vegetable farmers across East and Central Africa.' },
        { type: 'pathway', title: 'GOOD AGRICULTURAL PRACTICES', text: 'GAP is the backbone of safe, market-ready horticulture — covering site selection, input use, safe pesticide handling, hygiene, and record-keeping. It is the foundation for GlobalG.A.P. certification and export access.' },
        { type: 'pathway', title: 'AGROECOLOGY', text: 'Farming with nature, not against it — diversity, recycling, soil health, and protecting pollinators and beneficial insects. Agroecology builds resilience to pests, drought, and market shocks while cutting input costs.' },
        { type: 'pathway', title: 'MARKET LINKAGE', text: 'Horticulture is a business. Connecting farmers to cooperatives, aggregators, processors, supermarkets, and the hospitality trade is as important as agronomy. Strong farmer groups unlock bulking, extension, and bargaining power.' },
        { type: 'pathway', title: 'NUTRITION', text: 'Fruits and vegetables are central to household and community nutrition. Solidaridad pairs production training with agri-nutrition messaging so families eat — not only sell — what they grow.' },
        { type: 'h', text: 'The horticulture production calendar' },
        { type: 'p', text: 'Timing follows the rains and the target market. In a typical bimodal region: nursery raising and land preparation precede the rains; transplanting coincides with established rainfall (first rains around March-June suit tomato, onion, and leafy vegetables; second rains around September-December suit cabbage, cucurbits, and peppers); harvesting and marketing follow the crop cycle. Off-season production under irrigation captures the highest prices when supply is short.' },
        { type: 'highlight', text: 'Horticulture is high-leverage. Get the agronomy, food safety, and market linkage right, and income, nutrition, and resilience follow together.' },
      ],
    },
    {
      id: 'fruits-veg-nursery',
      title: 'Module 2 — Nursery, Propagation & Quality Planting Material',
      content: [
        { type: 'p', text: 'Most horticultural failures are decided before the crop reaches the field. Quality planting material — clean, true-to-type, and disease-free — is the single most important input. Get it wrong and no amount of field management can compensate.' },
        { type: 'h', text: 'Why clean planting material matters' },
        { type: 'list', items: [
          'Certified seed and registered nursery stock carry genetic purity and known disease status',
          'Seed-borne diseases (black leg in brassicas, viruses in sweet potato) spread from a single infected source through a whole crop',
          'Saved or recycled material loses vigour each generation — sweet potato yields decline from virus build-up that shows no visible symptoms',
          'Traceability from certified material underpins GlobalG.A.P. and export market access',
        ]},
        { type: 'callout', text: 'Discourage farmers from using their own saved seed for brassicas and sweet potato. The cost saving is a false economy — disease outbreaks and yield decline cost far more than certified material.' },
        { type: 'h', text: 'Propagation methods by crop type' },
        { type: 'pathway', title: 'SEED-RAISED VEGETABLES', text: 'Cabbage, kale, tomato, onion, and peppers are started in nurseries and transplanted. Use seedling trays with sterile media or a raised bed; sow in a fine tilth; cover lightly and mist until germination (about 8 days). Seedlings stay 4-6 weeks before transplanting.' },
        { type: 'pathway', title: 'GRAFTED FRUIT TREES', text: 'Avocado is propagated by grafting a selected scion onto a Phytophthora-tolerant rootstock. Rootstock seed comes from healthy mother trees, soaked in hot water below 50C for 30 minutes and fungicide-dipped. Seedlings are ready to graft about six months after germination, and ready to plant 3-4 months after grafting.' },
        { type: 'pathway', title: 'VEGETATIVE BANANA MATERIAL', text: 'Use tissue-culture plantlets (cleanest, uniform, disease-free, ordered in advance from certified labs) or carefully cleaned sword suckers — never water suckers. Peel and sterilise sucker corms in boiling water for 20-30 seconds to kill nematodes and weevils.' },
        { type: 'pathway', title: 'SWEET POTATO CUTTINGS', text: 'Use vine cuttings from healthy, high-yielding plants. Rapid Seed Multiplication takes 25-30 cm vine tips, cuts them into mini-cuttings of 2-3 nodes, and plants them in a nursery; vines are ready for the field in about four weeks. Source elite cleaned material from trained seed bulkers.' },
        { type: 'h', text: 'Running a quality nursery' },
        { type: 'list', items: [
          'Site nurseries away from production fields of the same crop family to break disease cycles',
          'Use sterile or balanced media — a 1:1:1 mix of soil, sand, and organic matter where commercial media is unavailable',
          'Provide shade during germination; reduce it gradually to harden seedlings',
          'Monitor for moisture, pests, and disease at least daily — act early',
          'Harden off for about a week before transplanting by cutting irrigation and exposing to full sun gradually',
        ]},
        { type: 'h', text: 'Variety selection checklist' },
        { type: 'value', title: 'MARKET FIT', text: 'Choose for the target market first — fresh local, processing, supermarket, or export. Read the seed merchant\'s varietal description and match it to demand (size, shape, shelf life, residue limits).' },
        { type: 'value', title: 'AGROCLIMATIC FIT', text: 'Match altitude, temperature, and rainfall. Avocado races group by altitude band; cabbage needs cool conditions; tomato fails to set fruit below 15C or above 35C.' },
        { type: 'value', title: 'PEST & DISEASE TOLERANCE', text: 'Prefer varieties with documented resistance — to fusarium and verticillium wilt and yellow leaf curl virus in tomato, to rust in banana, to Phytophthora in avocado rootstock.' },
        { type: 'highlight', text: 'Planting material is a one-time decision per crop cycle. Clean, certified, well-matched material removes most of what causes failure later.' },
      ],
    },
    {
      id: 'fruits-veg-soil-water',
      title: 'Module 3 — Soil, Land Preparation & Water Management',
      content: [
        { type: 'p', text: 'Soil is the foundation of horticulture. Healthy soil supplies nutrients, holds water, and hosts the organisms that suppress disease. Good land and water management is what turns a one-off harvest into a productive, sustainable system.' },
        { type: 'h', text: 'Reading your soil' },
        { type: 'p', text: 'Before committing to a crop or a fertiliser plan, know the soil. Signs of declining fertility include gradually falling yields despite more inputs, stunted growth, waterlogging, few or no earthworms when you dig, and indicator weeds. Soil testing for pH and nutrients should guide every fertiliser decision; visual and spade assessment is the field fallback.' },
        { type: 'list', items: [
          'Most fruits and vegetables prefer deep, well-drained loams rich in organic matter',
          'Target pH ranges by crop: avocado and sweet potato around 5-7, banana 5.6-7.5, tomato 6-7.5',
          'Avoid sites that stay wet — most horticultural crops are intolerant of waterlogging',
          'Rotate with non-related families — never follow tomato with another solanaceous crop, or cabbage with another brassica',
          'Check field history for bacterial wilt (tomato) in the last 3-4 years before planting',
        ]},
        { type: 'callout', text: 'Continuous cropping of the same family on the same land builds up soil-borne disease (fusarium wilt, club root, nematodes). Rotation is not optional — it is disease management.' },
        { type: 'h', text: 'Land preparation' },
        { type: 'list', items: [
          'Clear stumps, woody weeds, and perennial grasses during primary preparation',
          'Prepare a fine, firm seedbed for direct-sown and transplanted vegetables',
          'For tree crops, dig generous planting holes and separate topsoil from subsoil — sample both for analysis',
          'Refill holes a few days before planting with topsoil mixed with 20-25 kg manure and a phosphate fertiliser (e.g. TSP)',
          'Avoid working wet soils — they smear and compact',
        ]},
        { type: 'h', text: 'Integrated soil fertility management' },
        { type: 'pathway', title: 'ORGANIC MATTER FIRST', text: 'Compost, manure, mulch, and crop residues feed the soil and the organisms in it. Maintaining organic matter is the single most important practice for holding moisture in rain-fed crops and improving structure over time.' },
        { type: 'pathway', title: 'TARGETED FERTILISER', text: 'Use synthetic fertiliser to supplement, not replace, organic inputs. Apply phosphate at planting (DAP or TSP); split nitrogen and potassium over the season based on crop stage and soil test. Vegetative growth needs nitrogen; flowering and fruiting need potassium.' },
        { type: 'pathway', title: 'COVER & ROTATION', text: 'Cover crops, green manures, intercropping, and rotation return biomass to the soil, fix nitrogen, and break pest and disease cycles. Intercropping also raises soil biodiversity and food output per plot.' },
        { type: 'h', text: 'Water management' },
        { type: 'p', text: 'Water is the most common limiting factor. Most horticultural crops need consistent moisture, especially at transplanting, flowering, and fruit set. Plan irrigation as a market strategy — off-season irrigated production captures the highest prices.' },
        { type: 'list', items: [
          'Drip irrigation delivers water slowly to the root zone with minimal evaporation — the most efficient option for high-value crops',
          'Modern technologies like drip and greenhouse cultivation can raise productivity by up to 50%',
          'Mulching conserves soil moisture, suppresses weeds, and moderates soil temperature',
          'Rainwater harvesting and water-retention structures buffer dry spells',
          'Maintain organic matter to improve infiltration and water-holding capacity in rain-fed systems',
        ]},
        { type: 'callout', text: 'Time transplanting and direct sowing to the onset of established rains, or to assured irrigation. Planting into dry soil wastes seedlings and inputs.' },
        { type: 'highlight', text: 'Feed the soil and it will feed your crops. Soil health and water management are slow investments that pay back every season after.' },
      ],
    },
    {
      id: 'fruits-veg-ipm',
      title: 'Module 4 — Integrated Pest Management & Food Safety',
      content: [
        { type: 'p', text: 'Pests and diseases are the largest agronomic constraint in horticulture, and the leaf or fruit is often the part sold — so blemish-free quality matters. Integrated Pest Management (IPM) layers prevention, monitoring, and targeted control, using chemicals only when economic thresholds are crossed. It is both more sustainable and more cost-effective than spraying on schedule.' },
        { type: 'h', text: 'The IPM ladder — prevention first' },
        { type: 'pathway', title: 'CULTURAL CONTROL', text: 'Crop rotation, resistant varieties, clean seed, field sanitation, timely planting and harvesting, and good nutrition. These are preventive, not curative — they build the crop\'s ability to resist attack before pests arrive.' },
        { type: 'pathway', title: 'BIOLOGICAL CONTROL', text: 'Conserve and boost natural enemies — parasitic and predatory wasps, ground beetles, spiders, predatory mites, dragonflies. Most crops attract these beneficials naturally unless broad-spectrum pesticides have killed them off.' },
        { type: 'pathway', title: 'MECHANICAL & PHYSICAL', text: 'Sticky and light traps, eco-friendly nets over cabbages, floating row covers, and fruit bagging at least one month before harvest to exclude fruit fly. Laborious but effective for high-value or export fruit.' },
        { type: 'pathway', title: 'CHEMICAL — LAST RESORT', text: 'Use registered products only, chosen for the specific pest, applied at threshold, rotating modes of action to delay resistance. High-reproduction pests like Tuta absoluta and whitefly develop resistance fast where chemicals are overused.' },
        { type: 'h', text: 'Scouting and thresholds' },
        { type: 'p', text: 'Scouting is the heart of IPM: walk the field regularly, identify pests and natural enemies, estimate abundance and damage, and only then decide on control. Yellow sticky traps both monitor and reduce whitefly. Decisions follow the economic threshold — the pest level at which the cost of damage exceeds the cost of control.' },
        { type: 'h', text: 'Common pests and diseases to know' },
        { type: 'list', items: [
          'Tomato: whitefly (vectors yellow leaf curl virus), Tuta absoluta (tomato leafminer), spider mites, fruitworm; early and late blight, bacterial wilt, fusarium wilt',
          'Cabbage and kale: diamondback moth, cabbage looper, aphids; black rot, black leg, Alternaria leaf spot, downy mildew',
          'Avocado: scales, mites, thrips, false codling moth, fruit fly; root rot (Phytophthora), anthracnose',
          'Banana: banana weevil (larvae tunnel the corm) and nematodes — both spread by infected suckers, controlled by clean material',
          'Sweet potato: sweet potato weevil; Alternaria blight, black rot, post-harvest soft rots',
        ]},
        { type: 'h', text: 'Push-pull and botanical options' },
        { type: 'list', items: [
          'Push-pull intercropping: repellent "push" plants (desmodium, molasses grass) drive pests off the crop while "pull" trap plants (Napier, Sudan grass) draw them to the border',
          'Aromatic intercrops — garlic, basil, neem, onion — give partial protection through strong scent',
          'Botanical brews (ash brew, garlic and chilli extracts, sulphur-lime brew) offer low-cost control; apply early morning or late evening',
          'Caution: strong botanical concentrations can also kill beneficial organisms — use as directed',
        ]},
        { type: 'h', text: 'Food safety, safe pesticide use, and MRLs' },
        { type: 'p', text: 'In horticulture the harvest is eaten fresh, often raw, so food safety is non-negotiable. Pesticide misuse is a direct food-safety hazard and the most common reason produce is rejected from premium and export markets, which enforce Maximum Residue Limits (MRLs).' },
        { type: 'list', items: [
          'Use only products registered for the specific crop, and follow label rates exactly',
          'Observe the pre-harvest interval (PHI) on every product — this is what keeps residues below the MRL',
          'Wear protective equipment: gloves, mask, long sleeves; wash thoroughly after handling',
          'Never store chemicals near food; never reuse chemical containers or measuring spoons for food',
          'Calibrate sprayers, target the pest, and use reduced-volume localised application',
          'Keep spray records — what, when, how much, and PHI — to demonstrate compliance for certification and traceability',
        ]},
        { type: 'callout', text: 'A clean-looking field sprayed the day before harvest can still fail an MRL test and lose the whole consignment. The pre-harvest interval is a food-safety rule, not a guideline.' },
        { type: 'highlight', text: 'Walk the field before reaching for the sprayer. IPM protects the crop, the farmer\'s health, beneficial insects, and access to the markets that pay best.' },
      ],
    },
    {
      id: 'fruits-veg-postharvest',
      title: 'Module 5 — Harvesting, Post-Harvest Handling & Cold Chain',
      content: [
        { type: 'p', text: 'Fruits and vegetables are alive and perishable. A good crop can be destroyed in the hours between picking and selling. With regional post-harvest losses estimated at 30-40%, reducing loss is often the cheapest income gain on the farm — almost all of it is preventable.' },
        { type: 'h', text: 'Harvest at the right stage' },
        { type: 'p', text: 'Maturity indicators are crop- and market-specific. Harvest distance to market decides the stage — produce destined for distant markets is picked earlier.' },
        { type: 'list', items: [
          'Tomato: stage ranges from mature green to colour break; a mature-green tomato takes about 10 days to reach table-ripe',
          'Avocado: skin colour change, dry stalk attachment, dark seed coat, and the water-float test (immature fruit sinks)',
          'Cabbage: cut when the head is firm and full, close to the base; kale is snapped leaf by leaf',
          'Sweet potato: start checking root size from about 18 weeks; harvest carefully to avoid skinning',
          'Banana: harvest 3-4 months after flowering at the right finger fullness for the market',
        ]},
        { type: 'callout', text: 'Harvest in the cool of early morning or late evening, and get produce out of direct sun immediately. Field heat is the enemy — every hour in the sun shortens shelf life and quality.' },
        { type: 'h', text: 'Careful handling cuts losses' },
        { type: 'list', items: [
          'Handle gently — bruising in avocado and tomato is often invisible until the fruit is cut open',
          'Use field crates and boxes, never the bare ground; do not overload crates',
          'Move produce to shade for grading, cleaning, and repacking as soon as containers fill',
          'Grade and sort out diseased, damaged, and off-size produce before it contaminates the rest',
          'A light water spray cools leafy vegetables and slows wilting if there is a delay in the field',
        ]},
        { type: 'h', text: 'Curing, storage, and the cold chain' },
        { type: 'pathway', title: 'CURING', text: 'Sweet potato is cured after harvest to harden the skin for storage — properly cured and stored roots keep 1-6 months depending on variety. Curing seals wounds against rot.' },
        { type: 'pathway', title: 'TEMPERATURE CONTROL', text: 'Most fruits and vegetables keep best cool, but some are chilling-sensitive — tomato stores at about 15C and 85-90% humidity; too cold and it loses flavour. Match storage temperature to the crop.' },
        { type: 'pathway', title: 'COLD CHAIN', text: 'Pre-coolers, cold rooms, and refrigerated transport are what let fresh produce reach distant and export markets in grade. Underdeveloped cold chain is a leading cause of regional post-harvest loss and a priority sector investment.' },
        { type: 'pathway', title: 'PACKHOUSE & PACKAGING', text: 'Grading, washing, and protective packaging at a packhouse meet supermarket and export quality standards and protect produce in transit. Good packaging is loss prevention, not cost.' },
        { type: 'h', text: 'Where the losses happen' },
        { type: 'p', text: 'Loss concentrates at predictable points — poor harvesting and field heat, rough handling and grading, the absence of cold storage and reliable transport, and inadequate up-country packhouses. Targeting these is higher-return than chasing extra yield.' },
        { type: 'highlight', text: 'Cutting post-harvest loss from 35% toward 10% is often worth more per acre than any yield-boosting intervention. It is the cheapest harvest on the farm.' },
      ],
    },
    {
      id: 'fruits-veg-biodiversity',
      title: 'Module 6 — Biodiversity, Agroecology & Nutrition',
      content: [
        { type: 'p', text: 'Sustainable horticulture works with the wider ecosystem. Agroecology, pollinator protection, agroforestry, and agri-nutrition turn a productive plot into a resilient farm and a healthier household — the framework behind Solidaridad\'s Roots of Resilience approach.' },
        { type: 'h', text: 'The principles of agroecology' },
        { type: 'p', text: 'Agroecology is farming with nature rather than against it, combining ecological science with indigenous knowledge. The FAO principles simplify into farmer-friendly ideas:' },
        { type: 'list', items: [
          'Diversity — mix crops, trees, and animals so the farm resists pests, disease, and climate shocks and earns from several streams',
          'Synergies — let parts of the farm help each other, e.g. livestock manure feeding soil fertility',
          'Recycling — compost, mulch, and reuse organic materials to close nutrient cycles and cut waste',
          'Efficiency — use local resources wisely, from rainwater harvesting to on-farm inputs',
          'Resilience — build the capacity to bounce back from droughts, floods, and market swings',
          'Co-creation of knowledge — farmers learn from each other through field schools and demonstrations',
        ]},
        { type: 'h', text: 'Pollinators and beneficial habitat' },
        { type: 'p', text: 'Bees, butterflies, birds, and other pollinators are responsible for the fruit and seed set in most horticultural crops. Their populations are declining from habitat loss, pesticide use, and intensive practices — protecting them directly protects yields.' },
        { type: 'list', items: [
          'Plant for continuous blooming so pollinators have year-round forage',
          'Keep indigenous trees, flowering cover crops, intercropped legumes and herbs, and wildflower borders',
          'Create nesting spaces — bare ground patches for ground-nesting bees, bee hotels, and bamboo structures',
          'Minimise broad-spectrum pesticides, which kill pollinators and natural enemies alike',
        ]},
        { type: 'h', text: 'Agroforestry' },
        { type: 'pathway', title: 'WHAT IT IS', text: 'Deliberately integrating trees with crops, livestock, or pasture on the same land. Avocado and banana over coffee, or boundary and alley trees, are agroforestry in practice.' },
        { type: 'pathway', title: 'WHAT IT DELIVERS', text: 'Improved soil health and fertility, reduced erosion and runoff, microclimate buffering against heat and drought, carbon storage, and diversified income from fruit, fuelwood, timber, and medicinal plants.' },
        { type: 'h', text: 'Agri-nutrition — eating what you grow' },
        { type: 'p', text: 'Production training is paired with nutrition messaging so families benefit from their own harvest. The healthy-eating model emphasises generous servings of vegetables and fruits alongside starches, plant and animal proteins, and safe water.' },
        { type: 'list', items: [
          'Eat fruits and vegetables generously every day — 3-5 servings of vegetables and 2-4 of fruit',
          'Poor nutrition shows as frequent sickness, stunting, wasting, and vitamin-deficiency conditions such as blindness from low vitamin A',
          'Orange-fleshed sweet potato is a powerful, low-cost source of vitamin A',
          'Practise food hygiene — wash raw foods, separate raw and cooked, wash hands and equipment',
          'Preserve surplus by drying, salting, or other methods to extend availability past the season',
        ]},
        { type: 'callout', text: 'Note that processing changes nutrition — for example, around 20-25% of carotenoids are lost when sweet potato is boiled. Promote varied preparation and fresh consumption where possible.' },
        { type: 'highlight', text: 'A diverse, pollinator-friendly farm that feeds the household first is more resilient, more profitable, and more sustainable than a sprayed monoculture.' },
      ],
    },
    {
      id: 'fruits-veg-markets',
      title: 'Module 7 — Markets, Value Chains & Standards',
      content: [
        { type: 'p', text: 'Horticulture is a business, and agronomy only pays if the produce reaches a buyer in grade and on time. Field staff who understand the value chain, standards, and farmer organisation can turn good crops into good incomes.' },
        { type: 'h', text: 'The value chain' },
        { type: 'p', text: 'Produce moves from input suppliers and producers through aggregators and processors to three main destinations: local fresh consumption, domestic processing, and export. Each node adds value — and each is a point where quality and margin can be won or lost.' },
        { type: 'list', items: [
          'Smallholders dominate production but often sell individually at the farm gate for the lowest prices',
          'Semi-commercial farmers in groups and cooperatives access better inputs, extension, and buyers',
          'Commercial producers use irrigation, greenhouses, and certification to anchor export chains',
          'The hospitality sector — hotels, lodges, restaurants — is a growing, quality-conscious domestic market',
        ]},
        { type: 'h', text: 'Why farmer organisation matters' },
        { type: 'pathway', title: 'BULKING & BARGAINING', text: 'Organised groups aggregate volume, negotiate better prices, and meet the consistent supply that supermarkets and exporters demand. Disorganised value chains lose scale economies and market opportunities.' },
        { type: 'pathway', title: 'SERVICES & FINANCE', text: 'Groups improve access to extension, certified inputs, market information, and the credit and insurance that individual smallholders rarely secure. Records and bankable plans unlock financing.' },
        { type: 'h', text: 'Standards and certification' },
        { type: 'p', text: 'Markets are governed by standards. Meeting them is the difference between a premium export sale and a farm-gate giveaway.' },
        { type: 'value', title: 'GLOBALG.A.P.', text: 'The leading Good Agricultural Practice standard for fresh produce — covering safe input use, traceability, worker welfare, and hygiene. Often required for supermarket and EU access; cost and technical knowledge are the main barriers for smallholders.' },
        { type: 'value', title: 'MRLs & SPS', text: 'Maximum Residue Limits and sanitary and phytosanitary requirements govern food safety in export markets. Compliance depends on the safe pesticide use, pre-harvest intervals, and spray records covered in Module 4.' },
        { type: 'value', title: 'GRADING & TRACEABILITY', text: 'Consistent grading and the ability to trace produce back to the farm are baseline requirements for formal markets. Certified planting material and farm records make traceability possible.' },
        { type: 'h', text: 'Cutting losses and adding value' },
        { type: 'list', items: [
          'Invest in cold chain and packhouses to cut post-harvest loss and reach distant markets in grade',
          'Add value through processing — juice, paste, dried fruit — to capture margin and absorb gluts',
          'Plan production around market windows; irrigated off-season supply earns the best prices',
          'Reduce import dependence by supplying consistent, quality local produce to urban and hospitality buyers',
        ]},
        { type: 'callout', text: 'Counterfeit inputs, weak farmer organisation, and non-compliance with quality standards are the recurring barriers across the region. Field staff add the most value by addressing these, not just the agronomy.' },
        { type: 'highlight', text: 'Link the farmer to the market and the standard, and the agronomy finally pays. A well-organised group with certified, traceable, low-residue produce commands the best prices.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Horticulture Field Scenarios',
    scenarios: [
      {
        situation: 'A cooperative wants to save money by using vines from last season\'s sweet potato crop instead of sourcing cleaned material. The previous crop looked healthy but yields had been slipping for two seasons.',
        options: [
          { text: 'Support reusing the vines — they looked healthy, so there is no problem.', correct: false, feedback: 'Sweet potato viruses build up over generations and often show no visible symptoms. Healthy-looking vines can carry the viruses driving the yield decline the group is already seeing.' },
          { text: 'Explain the slipping yields are the cost of recycled material — virus build-up reduces yields even with no visible symptoms. Connect them to trained seed bulkers for elite cleaned material, then multiply it locally with Rapid Seed Multiplication.', correct: true, feedback: 'Correct. The two-season decline is the tell-tale sign of virus accumulation. Cleaned material plus Rapid Seed Multiplication restores yield potential at low cost.' },
          { text: 'Tell them sweet potato is not worth growing and suggest another crop.', correct: false, feedback: 'Defeatist and unnecessary. The yield gap (12.5 vs 30 t/ha potential) is closable with clean planting material and good practice.' },
        ],
      },
      {
        situation: 'A tomato farmer wants to spray a broad-spectrum insecticide on a weekly calendar schedule to "stay ahead" of whitefly and Tuta absoluta, regardless of how many pests are actually present.',
        options: [
          { text: 'Approve the calendar spray programme — prevention is better than cure.', correct: false, feedback: 'Calendar spraying of broad-spectrum products kills natural enemies and drives resistance fast in high-reproduction pests like whitefly and Tuta absoluta. It also risks MRL breaches.' },
          { text: 'Move to IPM — scout the field with yellow sticky traps, identify pests and natural enemies, and only treat at economic threshold, choosing registered products and rotating modes of action. Add cultural and biological measures first.', correct: true, feedback: 'Correct. Scouting and thresholds protect beneficials, slow resistance, cut cost, and keep residues compliant. Spraying on a schedule does the opposite.' },
          { text: 'Tell them to stop using any chemicals at all immediately.', correct: false, feedback: 'IPM does not ban chemicals — it uses registered products as a last resort at threshold. A blanket ban with a real pest problem can lose the crop.' },
        ],
      },
      {
        situation: 'An exporter rejects a consignment of green beans for exceeding the Maximum Residue Limit. The farmer insists the field was clean and the beans looked perfect, and he sprayed a registered product just two days before harvest to be safe.',
        options: [
          { text: 'Conclude the lab made an error, since a registered product was used.', correct: false, feedback: 'Using a registered product is not enough. Spraying two days before harvest almost certainly ignored the pre-harvest interval, leaving residues above the MRL.' },
          { text: 'Explain that the pre-harvest interval (PHI) on the label is what keeps residues below the MRL. Spraying close to harvest breaches it even with a registered product. Set up spray records and PHI tracking so future consignments comply.', correct: true, feedback: 'Correct. The PHI is a food-safety rule, not a guideline. Records and PHI discipline are what protect export access and the farmer\'s income.' },
          { text: 'Advise the farmer to stop exporting and sell only at the local market.', correct: false, feedback: 'Abandoning the premium market throws away the opportunity. The problem is fixable with PHI discipline and record-keeping, not market retreat.' },
        ],
      },
      {
        situation: 'A farmer harvests cabbages and tomatoes at midday and leaves them stacked in the open sun by the roadside for several hours while waiting for transport. He reports buyers keep complaining about quality.',
        options: [
          { text: 'Tell him quality complaints are normal and unavoidable for fresh produce.', correct: false, feedback: 'This accepts preventable loss. Field heat and rough roadside handling are exactly what is degrading the produce and the price.' },
          { text: 'Shift harvesting to early morning or late evening, move produce into shade immediately, use crates rather than the bare ground, and arrange transport before harvest. Light watering cools leafy crops if there is a delay.', correct: true, feedback: 'Correct. Removing field heat and handling gently are the cheapest, highest-return loss reductions available. With regional losses at 30-40%, this directly recovers income.' },
          { text: 'Recommend he buy a refrigerated truck before doing anything else.', correct: false, feedback: 'Cold chain helps, but the immediate, free wins are harvest timing, shade, crates, and transport planning. Start there before major capital investment.' },
        ],
      },
      {
        situation: 'A field officer notices a partner farm sprays broad-spectrum pesticides heavily and has cleared all hedgerows and flowering plants. The farmer complains that fruit set in his avocado and passion fruit has been poor.',
        options: [
          { text: 'Recommend a stronger insecticide programme to fix the poor fruit set.', correct: false, feedback: 'More spraying makes it worse. Poor fruit set points to a pollinator problem caused by heavy pesticides and the loss of pollinator habitat.' },
          { text: 'Link the poor fruit set to lost pollinators — heavy broad-spectrum spraying and cleared habitat have driven out the bees that set the fruit. Reduce broad-spectrum use, restore flowering borders, indigenous trees, and nesting spaces.', correct: true, feedback: 'Correct. Pollinators set the fruit in these crops. Protecting them with reduced spraying and restored habitat directly recovers yield — an agroecology win.' },
          { text: 'Tell him fruit set is genetic and nothing can be done in the field.', correct: false, feedback: 'Incorrect. While variety matters, the sudden drop after habitat clearing and heavy spraying clearly points to a manageable pollinator cause.' },
        ],
      },
      {
        situation: 'A group of smallholders each sell tomatoes individually at the farm gate to traders at low prices, and have been turned away by a supermarket buyer for inconsistent supply and lack of certification.',
        options: [
          { text: 'Advise each farmer to keep selling individually — the farm gate is simplest.', correct: false, feedback: 'Individual farm-gate selling locks in the lowest prices and cannot meet the volume or standards formal buyers require. It misses the opportunity entirely.' },
          { text: 'Help them organise into a group to bulk produce and meet consistent supply, then work toward GlobalG.A.P. compliance with grading, traceability, and spray records, and link to the supermarket and hospitality buyers.', correct: true, feedback: 'Correct. Organisation unlocks volume, bargaining power, services, and the path to certification. Bulking plus standards is what opens premium, reliable markets.' },
          { text: 'Tell them to lower their prices further to win the supermarket contract.', correct: false, feedback: 'The barrier is consistency and certification, not price. Cutting prices erodes income without solving the supply and standards problem.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'Estimated regional post-harvest loss in fruits and vegetables is around:', options: ['Under 5%', '10-15%', '30-40%', 'Over 70%'], answer: 2 },
    { q: 'The cleanest, most uniform planting material for banana is:', options: ['Water suckers', 'Saved corms from any plant', 'Tissue-culture plantlets', 'Seeds from ripe fruit'], answer: 2 },
    { q: 'Avocado is propagated for commercial production mainly by:', options: ['Direct seeding in the field', 'Grafting a scion onto a Phytophthora-tolerant rootstock', 'Tissue culture only', 'Vine cuttings'], answer: 1 },
    { q: 'Why should farmers avoid following tomato with another solanaceous crop on the same land?', options: ['It wastes water', 'It builds up soil-borne disease such as bacterial and fusarium wilt', 'Tomatoes need acidic soil', 'It is required for certification'], answer: 1 },
    { q: 'In IPM, chemical pesticides should be used:', options: ['On a fixed weekly calendar', 'As a last resort, at economic threshold, with registered products', 'Never, under any circumstances', 'Only broad-spectrum products'], answer: 1 },
    { q: 'The pre-harvest interval (PHI) on a pesticide label exists to:', options: ['Improve fruit colour', 'Keep residues below the Maximum Residue Limit', 'Speed up ripening', 'Reduce water use'], answer: 1 },
    { q: 'A push-pull system controls pests by:', options: ['Spraying twice as often', 'Using repellent "push" plants and trap "pull" plants', 'Removing all other plants', 'Flooding the field'], answer: 1 },
    { q: 'Tomatoes store best at approximately:', options: ['0-2C', 'About 15C and 85-90% humidity', '30C in full sun', 'Below freezing'], answer: 1 },
    { q: 'The single most important practice for holding moisture in rain-fed horticulture is:', options: ['Adding more synthetic fertiliser', 'Maintaining soil organic matter', 'Planting deeper', 'Spraying herbicide'], answer: 1 },
    { q: 'Modern technologies such as drip irrigation and greenhouses can raise productivity by up to:', options: ['5%', '50%', '200%', 'No measurable amount'], answer: 1 },
    { q: 'Orange-fleshed sweet potato is a particularly good, low-cost source of:', options: ['Vitamin A', 'Iron only', 'Protein', 'Calcium'], answer: 0 },
    { q: 'The recommended healthy-eating guidance for vegetables and fruits is to eat them:', options: ['Sparingly', 'Generously every day', 'Only when sick', 'Once a week'], answer: 1 },
    { q: 'Poor fruit set in avocado and passion fruit after heavy spraying and habitat clearing most likely indicates:', options: ['A need for more pesticide', 'Loss of pollinators', 'Too much organic matter', 'Soil that is too fertile'], answer: 1 },
    { q: 'The leading Good Agricultural Practice standard required for many fresh-produce export markets is:', options: ['ISO 9001', 'GlobalG.A.P.', 'Fairtrade only', 'There is no standard'], answer: 1 },
    { q: 'For smallholders facing low farm-gate prices and rejection by formal buyers, the most effective first step is to:', options: ['Lower their prices further', 'Keep selling individually', 'Organise into groups to bulk produce and work toward certification', 'Stop growing horticulture'], answer: 2 },
  ],
});


COURSES.push({
  id: 'food-crops',
  title: 'Food Crops: Yields, Resilience & Nutrition',
  subtitle: 'Productive, climate-resilient and nutritious staples',
  category: 'Commodities',
  icon: commodityIcon(foodCropsIcon),
  duration: '1 hr 10 min',
  description: 'A six-module summary of Solidaridad ECA\'s food crops curriculum — drawing on the CSV Maize agronomy and Cereal GAP manuals, the P4G Climate-Smart Agriculture manual, the SAVE agroforestry and Roots of Resilience biodiversity handbooks, the FOSEK food crop and nutrition guide, and the VSLA training manual. Built for staff who support field teams, lead-farmer trainers, and partner cooperatives across maize and cereals, beans, sweet potato, and vegetables.',
  lessons: [
    {
      id: 'food-crops-overview',
      title: 'Module 1 — Food Crops & Solidaridad\'s Work',
      content: [
        { type: 'p', text: 'Food crops are the foundation of household food security, nutrition, and income for the smallholders Solidaridad ECA serves. This course pulls together the staple-crop curriculum — cereals (maize, sorghum, millet), legumes (beans, cowpea, pigeon pea), roots (sweet potato), and vegetables — into one working summary for staff who support field training.' },
        { type: 'h', text: 'Why food crops matter' },
        { type: 'list', items: [
          'Staple cereals (maize, sorghum, rice, wheat, millet) supply the bulk of household calories across the region',
          'Legumes fix nitrogen, improve soil fertility, and add dietary protein when intercropped with cereals',
          'Orange-flesh sweet potato is a cost-effective source of vitamin A for children and pregnant or lactating mothers',
          'Vegetables and fruit diversify diets and generate steady cash income, often led by women',
          'Diversified food-crop systems spread climate and market risk so the failure of one crop is not total loss',
        ]},
        { type: 'h', text: 'The yield gap is the opportunity' },
        { type: 'stat', number: '25-30 bags/acre', label: 'Level A maize yield with quality inputs', detail: 'Certified seed, recommended fertiliser, correct spacing and weeding (Cereal GAP manual)' },
        { type: 'stat', number: '3 bags/acre', label: 'Level C maize yield', detail: 'No fertiliser, recycled seed, low plant population — the practice gap, not a soil limit' },
        { type: 'stat', number: '12.5 t/ha', label: 'National sweet potato average', detail: 'Against a potential of 30 t/ha — the same practice-driven gap (FOSEK guide)' },
        { type: 'callout', text: 'The gap between Level A and Level C yields is almost entirely about practices, not soils. Closing it is exactly what good extension support delivers.' },
        { type: 'h', text: 'Solidaridad\'s food crops work' },
        { type: 'p', text: 'This course is built on Solidaridad ECA project materials: the CSV Maize project (climate-smart maize agronomy and conservation agriculture), the P4G project in Makueni (climate-smart horticulture and post-harvest), the SAVE project in Nyandarua (agroforestry for vegetable systems), the Roots of Resilience project in Taita Taveta (biodiversity), the FOSEK programme (food crop GAP and nutrition alongside coffee), and the VSLA training manual for farmer economic empowerment.' },
        { type: 'pathway', title: 'GOOD AGRICULTURAL PRACTICES (GAP)', text: 'Effective, efficient and sustainable practices applied through the whole production cycle to improve soil quality, water use, crop and environmental management. The core pillars are good soil management, water management, crop husbandry, crop protection, and environmental management.' },
        { type: 'pathway', title: 'CLIMATE-SMART AGRICULTURE (CSA)', text: 'An approach integrating adaptation, mitigation and food security to transform farming systems to cope with climate change — without depleting the natural resource base. The three pillars are productivity, adaptation, and mitigation.' },
        { type: 'pathway', title: 'FARMING AS A BUSINESS', text: 'Every farm is a business. Level A farmers plan with a crop calendar and a business plan, buy the right quantities of inputs from approved stores, plan family food needs, and time their sales to avoid the harvest price glut.' },
        { type: 'pathway', title: 'FARMER ECONOMIC EMPOWERMENT', text: 'Village Savings and Loans Associations (VSLAs) give remote and poor households access to small amounts of local capital on flexible terms, building the savings and credit base that lets farmers invest in inputs and weather shocks.' },
        { type: 'highlight', text: 'Food crops are high-leverage. Get the agronomy, the climate resilience, and the economics right, and food security, nutrition, and income all follow.' },
      ],
    },
    {
      id: 'food-crops-gap',
      title: 'Module 2 — Cereal Agronomy & Good Agricultural Practices',
      content: [
        { type: 'p', text: 'Maize and the other cereals are the staples around which most of these farming systems are built. The Cereal GAP and CSV Maize manuals lay out a practice sequence — land preparation, seed, nutrition, field management, harvest — that any field officer should be able to walk a farmer through.' },
        { type: 'h', text: 'Land preparation' },
        { type: 'list', items: [
          'Remove shrubs and stumps, then plough with hand hoe (jembe/panga), oxen, or tractor',
          'Plough when the land is dry; incorporate plant residue and manure to maintain fertility',
          'Good preparation aerates soil to at least 15 cm and lets roots penetrate better',
          'Early preparation exposes soil pests to the sun, catalyses organic matter decomposition, and enables early planting into warm soil',
          'Select an open field with limited tree shading; avoid steep slopes, stony, and waterlogged sites',
        ]},
        { type: 'h', text: 'Seed and spacing' },
        { type: 'p', text: 'Certified seed (verified by an agency such as KEPHIS in Kenya) gives higher and guaranteed germination, in-built pest and disease tolerance, crop uniformity, and freedom from seed-borne disease. The spacing rules are precise:' },
        { type: 'value', title: 'MAIZE', text: '30 cm between seeds, 75 cm between rows, 1 seed per hill, planted 5 cm deep. About 8-10 kg of seed per acre; target 18,000-21,000 plants per acre for optimum yield.' },
        { type: 'value', title: 'SORGHUM', text: '20 cm between seeds, 60 cm between rows, 3 seeds per hill, 5 cm deep. About 3-4 kg of seed per acre. Plant early and be ready when the rain becomes steady.' },
        { type: 'h', text: 'Crop nutrition and soil fertility' },
        { type: 'list', items: [
          'Maize responds well to compost or manure: about 16 t/ha (7 t/acre) on depleted soils, 8 t/ha (4 t/acre) on moderately fertile soil',
          'Apply manure or compost early, after the first cultivation, so establishing plants can take up nutrients',
          'Apply basal fertiliser 5 cm below and 5 cm to the side of the seed — never in direct contact',
          'Top-dress at the 4-8 leaf stage (before flowering); in high-rainfall areas split into two applications, about week 4 and week 8',
          'Read the leaf: yellowing from older leaves signals nitrogen deficiency; reddish-purple leaves signal phosphorus deficiency',
          'Lime reduces soil acidity and raises pH where flowering, nodulation, and yield are poor',
        ]},
        { type: 'callout', text: 'Use the CORRECT fertiliser type, amount, time and placement — do not guess the rate, and never let basal fertiliser touch the seed.' },
        { type: 'h', text: 'Field management and harvest' },
        { type: 'list', items: [
          'Thin and gap one week after emergence to maintain the target plant population',
          'Weed control is critical in the first 8 weeks — weeds compete for nutrients, water, light, and space and harbour pests',
          'Maize is mature when the plant turns straw-coloured and cobs droop downwards; kernel moisture can still be ~25%, so pre-dry in the field',
          'Sorghum is mature when a black layer forms at the base of the kernel; moisture is then 25-30%',
        ]},
        { type: 'highlight', text: 'GAP is a sequence, not a single trick. Each step — land, seed, nutrition, weeding, timely harvest — protects the value created by the last.' },
      ],
    },
    {
      id: 'food-crops-csa',
      title: 'Module 3 — Climate-Smart & Conservation Agriculture',
      content: [
        { type: 'p', text: 'Climate change brings higher temperatures, erratic rainfall, more droughts and floods, and new pest pressures — drying soils, reducing yields, and shifting where crops can grow. The P4G Climate-Smart Agriculture manual frames the response staff should support: adaptation, mitigation, and productivity together.' },
        { type: 'h', text: 'The three pillars of CSA' },
        { type: 'pathway', title: 'ADAPTATION', text: 'Reduce vulnerability to climate hazards: drought-tolerant varieties, drip irrigation and water-efficient technologies, raised nursery beds in flood-prone areas, and shifting planting times.' },
        { type: 'pathway', title: 'MITIGATION', text: 'Reduce greenhouse-gas emissions and store carbon: zero/minimum tillage, integrated nutrient management, cover crops and residue incorporation, and solar-powered irrigation replacing diesel pumps.' },
        { type: 'pathway', title: 'PRODUCTIVITY', text: 'Maintain or raise output per unit area. A CSA practice must not sacrifice productivity — it should do at least two of the three pillars, and the best do all three.' },
        { type: 'callout', text: 'Few practices score positive on all three pillars. The CSA framework is a way of making the trade-offs visible, not a fixed prescription.' },
        { type: 'h', text: 'Conservation agriculture and tillage' },
        { type: 'p', text: 'Conservation Agriculture promotes minimum soil disturbance, maintenance of crop residue cover, and crop rotation or intercropping. CSA land preparation requires a site-specific choice between methods:' },
        { type: 'value', title: 'ZERO TILLAGE', text: 'Slashing and/or non-selective herbicide (glyphosate); seed placed into undisturbed soil. Maximum residue cover.' },
        { type: 'value', title: 'MINIMUM TILLAGE', text: 'Potholing or ripping with rippers, sub-soilers, chisel ploughs, jab planters, or animal-drawn planters. Tillage confined to the planting line, removing hard pans and improving water flow.' },
        { type: 'value', title: 'CONVENTIONAL PLOUGHING', text: 'By hand hoe, animal-drawn plough, or tractor to at least 15 cm with harrowing. Higher labour, fuel, and erosion exposure.' },
        { type: 'h', text: 'Water-, soil-, and nitrogen-smart practices' },
        { type: 'list', items: [
          'Water-smart: rainwater harvesting (water pans, roof gutters, ponds), drip irrigation at the root zone, half-moon and zai pits, broad beds and furrows',
          'Soil-smart: fanya juu / fanya chini terraces (typical trench 60 cm by 60 cm, 10-20 m apart), stone or soil bunds, mulching, and organic manure',
          'Nitrogen-smart: green manure (contributing organic matter comparable to 9-13 t/acre of farmyard manure), cover crops, and leaf colour charts to guide nitrogen needs',
          'Energy-smart: solar dryers and solar irrigation to cut fuel use and post-harvest loss',
          'Drought-tolerant and biofortified varieties: green grams, cowpeas, sorghum, nyota beans',
        ]},
        { type: 'callout', text: 'Apply mulch at the end of the rains, not before heavy rain (which leaves soil too wet); in arid and semi-arid areas, mulch at the start of rains to maximise infiltration. On vegetable plots, wait until seedlings are slightly advanced so fresh mulch decomposition does not harm them.' },
        { type: 'h', text: 'Honest timelines' },
        { type: 'p', text: 'Conservation tillage delivers immediate erosion protection and lower labour and fuel costs, but soil-structure and yield benefits build slowly. Pair it with mulching — which is positive across all three CSA pillars from year one — for visible early wins while the slower benefits accrue.' },
        { type: 'highlight', text: 'A good CSA practice does at least two of the three pillars. Be honest about timelines, and combine slow-building practices with quick wins.' },
      ],
    },
    {
      id: 'food-crops-agroforestry',
      title: 'Module 4 — Agroforestry & Biodiversity',
      content: [
        { type: 'p', text: 'Agroforestry deliberately integrates trees with crops, livestock, or pasture. The SAVE agroforestry manual and the Roots of Resilience biodiversity handbook show how on-farm trees and biodiversity build resilience while delivering food, fodder, fuel, and income.' },
        { type: 'h', text: 'Why agroforestry' },
        { type: 'list', items: [
          'Improves food security and diversifies income — fruits, nuts, vegetables, fodder, plus potential carbon payments',
          'Enhances soil fertility and carbon through deep root systems and nutrient cycling',
          'Increases biodiversity of plants, insects, and animals — supporting pest control and pollination',
          'Manages water: deep roots cut surface runoff, improve infiltration, and recharge groundwater',
          'Provides products and services: food, shade, windbreak, energy, medicine, timber, and savings on the hoof',
        ]},
        { type: 'h', text: 'Choosing a good agroforestry tree' },
        { type: 'p', text: 'When supporting tree selection, work through whether the tree is preferred and accessible to the farmer, meets their expected benefits, and is matched to the site. Strong candidates have these traits:' },
        { type: 'list', items: [
          'Good leaf litter that releases nutrients at the right time in the crop cycle',
          'Ability to fix nitrogen (fertiliser tree species such as Leucaena, Gliricidia, Cajanus cajan, Sesbania)',
          'Resprouts quickly after pruning, pollarding, or coppicing',
          'Deep tap root that reaches minerals beyond other plants and stores them in leaves for dry-spell release',
          'Resistance to climate hazards, suited to local climate and soil, and free of negative local taboos',
        ]},
        { type: 'h', text: 'Tree management practices' },
        { type: 'value', title: 'PRUNING', text: 'Selective removal of lower-crown branches to reduce shade on nearby crops, improve trunk quality, and harvest branch wood early.' },
        { type: 'value', title: 'POLLARDING', text: 'Removing upper branches while leaving base and roots intact — restricts height, reduces shade, and yields fodder or wood. A 2-5 year interval suits timber. Suits Grevillea robusta, Markhamia lutea, Croton, Cordia abyssinica.' },
        { type: 'value', title: 'COPPICING', text: 'Cutting an established tree to its base to trigger many fresh shoots — almost a propagation method. Casuarina, Grevillea, Sesbania, and some Albizia coppice well when young.' },
        { type: 'value', title: 'LOPPING & THINNING', text: 'Lopping harvests branches without killing the tree; thinning removes whole trees to reduce competition. Heavy lopping can retard growth in some species.' },
        { type: 'h', text: 'Biodiversity and pollinators' },
        { type: 'p', text: 'Agroecology farms with nature rather than against it. The Roots of Resilience handbook builds on ten FAO agroecology principles — diversity, synergies, recycling, efficiency, resilience, knowledge co-creation, human and social values, culture, governance, and circular economy. Protecting biodiversity on the farm protects production.' },
        { type: 'list', items: [
          'Pollinators (bees and other insects) underpin yields of many fruits and vegetables — protect their forage and nesting habitat',
          'Natural enemies (parasitic and predatory wasps, ground beetles, spiders, predatory mites) suppress pests when not wiped out by broad-spectrum pesticides',
          'Grow local seed varieties, intercrop and rotate, and keep hedgerows, trees, and natural vegetation as habitat',
        ]},
        { type: 'callout', text: 'Broad-spectrum pesticides used over time kill the beneficial insects that crops naturally attract — the very pollinators and predators that keep pests in check. Protecting biodiversity is itself pest management.' },
        { type: 'highlight', text: 'Trees and biodiversity are not separate from food production — they are the resilient infrastructure that keeps it productive under climate stress.' },
      ],
    },
    {
      id: 'food-crops-diversification',
      title: 'Module 5 — Crop Diversification, Sweet Potato & Agri-Nutrition',
      content: [
        { type: 'p', text: 'A resilient food-crop farm grows more than one thing. Crop diversification and intercropping spread risk, improve soil, and — when the right crops are chosen — close nutrition gaps. This module covers diversification, the standout role of orange-flesh sweet potato, and the agri-nutrition message staff carry into the field.' },
        { type: 'h', text: 'Diversification and intercropping' },
        { type: 'list', items: [
          'Diversification grows different crops across seasons or plots so no single failure is total loss — e.g. maize one season, legumes the next',
          'Intercropping plants two or more crops together — maize with beans, sorghum with cowpeas — using nutrients, water, and light efficiently',
          'Legumes in the system fix nitrogen for the following cereal crop',
          'Mixed systems slow pest and disease spread and provide better ground cover against erosion and moisture loss',
          'Beans, soybeans, peas, and fallow are good rotation crops before a cereal',
        ]},
        { type: 'h', text: 'Sweet potato — the resilient root' },
        { type: 'p', text: 'Sweet potato (Ipomoea batatas) grows across wide agro-ecological zones, is drought resistant, and uses the whole plant — roots as food, vines as fodder. Orange-flesh sweet potato (OFSP) is the nutrition priority because it is rich in beta-carotene.' },
        { type: 'list', items: [
          'Develops in 90-150 days; well suited to relay-cropping, intercropping, and double cropping; tolerates light shade',
          'Prefers light sandy or silt loam, pH 5-6.7, with good drainage; 750 mm rainfall or more',
          'Propagate from clean apical vine cuttings, 20-40 cm with 5-8 nodes, burying one-third to two-thirds; rapid seed multiplication gives clean stock from KALRO elite material',
          'Plant on ridges 30-45 cm high, spaced 90-120 cm apart, with vines 20-35 cm apart (3-5 plants per metre)',
          'Hill up at weeding to suppress the sweet potato weevil — the most serious pest — and use clean material, crop rotation, field sanitation, and timely harvest',
        ]},
        { type: 'stat', number: '32 RE', label: 'Pro-vitamin A in orange-flesh sweet potato', detail: 'A cost-effective vitamin A source; a small 125 g root meets a child\'s daily need (FOSEK guide)' },
        { type: 'callout', text: 'Many generations of vegetatively propagated sweet potato build up viruses that often show no symptoms, causing silent yield decline. Renew planting material from clean, certified stock.' },
        { type: 'h', text: 'Agri-nutrition for staff' },
        { type: 'p', text: 'Production is only half the goal — what households actually eat is the other half. The FOSEK agri-nutrition message uses a healthy-eating pyramid: water (8 glasses/day) and starches at the base, generous vegetables and fruit, regular plant proteins, moderate animal proteins, and sparing fats, oils, salt, and sugar.' },
        { type: 'list', items: [
          'Poor nutrition shows as stunting, wasting, frequent sickness, rickets, skin infections, and vitamin A deficiency blindness',
          'Exclusive breastfeeding for the first 6 months and adequate nutrients afterwards prevent stunting',
          'Food hygiene: wash raw foods, keep raw and cooked separate, wash hands after the farm and the toilet',
          'Preservation (drying, freezing, salting, smoking) extends availability of seasonal foods and cuts later costs',
          'Boiling sweet potato loses 20-25% of carotenoids — encourage steaming, roasting, or baking to retain vitamin A',
        ]},
        { type: 'highlight', text: 'Diversify the plot, prioritise nutrient-dense crops like OFSP, and connect production to what reaches the plate. Yield without nutrition is a half-finished job.' },
      ],
    },
    {
      id: 'food-crops-business',
      title: 'Module 6 — Farm as a Business, VSLA & Post-Harvest',
      content: [
        { type: 'p', text: 'A good crop is only income if it is sold well and stored safely, and farmers can only invest in better practices if they can save and access credit. This module covers farming as a business, the VSLA model for economic empowerment, and the post-harvest practices that protect the value of the harvest.' },
        { type: 'h', text: 'Farming as a business' },
        { type: 'list', items: [
          'Level A farmers plan with two tools: a crop calendar (timing every operation against expected rains) and a business plan (expected costs and income)',
          'A business plan needs accurate field size, input prices, labour and harvesting costs, expected bags per acre, and price per bag',
          'Calculate required input quantities exactly — do not guess; buy only the pack sizes you need from approved stores with authentic labels',
          'Plan family food needs in advance: decide how much grain to keep and how much to sell',
          'Good storage lets a farmer hold grain over a year and sell when prices rise, not at the harvest glut',
        ]},
        { type: 'callout', text: 'Do not side-sell crops or default on cooperative loans — it harms the farmer and every other member of the cooperative. Honour buyer contracts and use loans only for their intended purpose.' },
        { type: 'h', text: 'Village Savings and Loans Associations (VSLA)' },
        { type: 'p', text: 'VSLAs give households — however remote or poor — access to small amounts of local capital on flexible terms at low risk and negligible cost. They are the savings-and-credit base that lets farmers invest in inputs and absorb shocks.' },
        { type: 'list', items: [
          '15 to 25 self-selected members; in mixed groups, at least 3 of 5 committee members are female',
          'Members buy 1 to 5 shares per meeting at a value set low enough for the poorest to buy at least one share',
          'Savings form a loan fund; borrowers repay with a service charge set by the group (commonly 5-20%)',
          'A separate social fund provides small emergency grants (e.g. funeral expenses)',
          'A lockable cash box with three padlocks held by three key-holders, plus member passbooks, keep transactions transparent at meetings',
          'The cycle is time-bound (usually 9-12 months); savings and earnings are shared out proportionally at the end',
        ]},
        { type: 'h', text: 'Post-harvest management' },
        { type: 'p', text: 'In Sub-Saharan Africa, post-harvest cereal losses alone cost nearly USD 4 billion a year — about 15% of production. On Kenyan farms, 20-30% of stored maize can be lost within 6 months without intervention, mostly to insect pests, rodents, and pathogens. Almost all of it is preventable.' },
        { type: 'list', items: [
          'Harvest on time (cobs drooping), dry properly on tarpaulins, sort, then shell',
          'Clean and disinfect the store; remove all old grain; stack on raised platforms, not the floor',
          'Treat grain with storage insecticidal dust (about 50 g per 90 kg bag) where appropriate',
          'Use hermetic storage bags or metal silos to suffocate insects without chemicals and hold grain until prices rise',
          'Use solar dryers to dry produce faster, retain nutrients, and protect against contamination — a key tool in the P4G post-harvest model',
        ]},
        { type: 'stat', number: '45%', label: 'Targeted food-loss reduction (P4G)', detail: 'Through improved post-harvest handling and IoT-enabled solar dryers in Makueni County' },
        { type: 'callout', text: 'Reducing post-harvest losses is often the cheapest yield gain on the farm — it captures grain you have already grown, dried, and paid for.' },
        { type: 'highlight', text: 'Agronomy grows the crop; business skills, savings, and post-harvest care turn it into lasting income and food security.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Food Crops Field Scenarios',
    scenarios: [
      {
        situation: 'A maize farmer in your project harvests 3 bags per acre and blames poor soil. A neighbour on the same soil type, using certified seed, recommended fertiliser, and correct 75 cm by 30 cm spacing, harvests 25 bags per acre.',
        options: [
          { text: 'Recommend a soil-amendment programme as the primary intervention.', correct: false, feedback: 'Amendments may help at the margin, but a gap between 3 and 25 bags on the same soil is a practice gap, not a soil problem. Diagnose practices first.' },
          { text: 'Walk through the Level A practice basics — certified seed, plant population (18,000-21,000 plants/acre), correct fertiliser type, rate and placement, and weeding in the first 8 weeks. The same soil that gives the neighbour 25 bags can give this farmer the same with the right methods.', correct: true, feedback: 'Correct. The Cereal GAP manual frames this directly as the difference between Level C and Level A farming — inputs and practices, not soil. Diagnose practices first, test soil second.' },
          { text: 'Suggest the farmer switch to a less demanding crop.', correct: false, feedback: 'Defeatist. The farmer has a large, closable yield gap. Switching crops abandons that opportunity.' },
        ],
      },
      {
        situation: 'A field officer is helping a farmer apply basal fertiliser at planting and suggests dropping the fertiliser and the maize seed into the same hole together to save labour.',
        options: [
          { text: 'Approve it — fewer passes saves time.', correct: false, feedback: 'Fertiliser in direct contact with the seed causes seed burn and poor germination. The GAP rule is explicit on placement.' },
          { text: 'Correct the placement: basal fertiliser goes about 5 cm below and 5 cm to the side of the seed, never in direct contact. Use the correct type and rate — do not guess.', correct: true, feedback: 'Correct. The Cereal GAP manual stresses the four correct factors: right type, amount, time, and placement. Direct contact burns the seed.' },
          { text: 'Tell them placement does not matter as long as the rate is right.', correct: false, feedback: 'Placement matters as much as rate. Contact with concentrated fertiliser damages the germinating seed regardless of total quantity.' },
        ],
      },
      {
        situation: 'A farmer is sceptical of conservation tillage because he was told the yield benefits take years, and he wants results this season.',
        options: [
          { text: 'Drop conservation tillage from the recommendations.', correct: false, feedback: 'Accepting the constraint abandons a practice with real long-term value. There is a better answer.' },
          { text: 'Be honest about the timeline, then show the immediate wins: conservation tillage cuts erosion and lowers labour and fuel costs this season, while soil-structure and yield benefits build over years. Pair it with mulching, which is positive across all three CSA pillars from year one.', correct: true, feedback: 'Correct. Do not oversell. Acknowledge the slow benefits, point to this-season wins, and combine with a quick-win practice like mulching so the farmer sees value immediately.' },
          { text: 'Mandate the practice without explanation.', correct: false, feedback: 'Adults respond poorly to mandates without rationale, and staff who issue them lose credibility.' },
        ],
      },
      {
        situation: 'A farmer wants to plant orange-flesh sweet potato from vines saved off her own crop for the fourth straight season. Yields have been quietly declining each year.',
        options: [
          { text: 'Support indefinite reuse of her own vines — it saves money.', correct: false, feedback: 'The quiet yield decline is the cost. Sweet potato vines accumulate viruses that often show no symptoms, so reuse degrades yield silently.' },
          { text: 'Explain the silent virus build-up in vegetatively propagated sweet potato and connect her to clean, certified planting material — KALRO elite stock multiplied through trained bulkers or rapid seed multiplication. Select clean apical cuttings going forward.', correct: true, feedback: 'Correct. The FOSEK guide notes that many generations of saved vines build up viruses that cause yield decline with no obvious symptoms. Renewing from clean stock recovers the lost yield.' },
          { text: 'Tell her to abandon sweet potato since the variety is exhausted.', correct: false, feedback: 'The variety is not exhausted — the planting material is virus-loaded. Clean stock solves it.' },
        ],
      },
      {
        situation: 'A new VSLA group of 22 members wants to skip electing a committee and keep the cash with one trusted member at her home, because everyone knows each other.',
        options: [
          { text: 'Agree — a small trusted group does not need formal structure.', correct: false, feedback: 'This is exactly the VSLA training-manual story that ends in disputed totals and a broken group. Trust without structure fails under money pressure.' },
          { text: 'Insist on the core VSLA controls: an elected committee, a lockable cash box with three padlocks held by three different key-holders, member passbooks, and all transactions done in front of the group at meetings.', correct: true, feedback: 'Correct. Transparency controls — committee, three-lock box, passbooks, and public transactions — are what prevent the disputes that destroy informal groups. They protect members from each other and from suspicion.' },
          { text: 'Let them start informally and add controls later if problems arise.', correct: false, feedback: 'By the time disputes arise, trust is already damaged. The controls must be in place from the first meeting.' },
        ],
      },
      {
        situation: 'A farmer stores shelled maize in jute bags inside a mud-walled granary and reports losing roughly a quarter of it to weevils and rodents within a few months. He is open to change.',
        options: [
          { text: 'Recommend selling everything at harvest to avoid storage altogether.', correct: false, feedback: 'Forced harvest-time selling locks in the worst price of the year (the harvest glut) and removes the farmer\'s negotiating power. Storage is the solution, not avoidance.' },
          { text: 'Move to hermetic storage — hermetic bags or a metal silo — which suffocates insects without chemicals, combined with a clean store, raised platforms, rodent control, and proper drying first. This also lets him hold grain until prices rise.', correct: true, feedback: 'Correct. Hermetic storage cuts insect losses to near zero without chemicals, and combined with a clean, raised, rodent-managed store the 20-30% loss can fall dramatically. It is among the cheapest gains on the farm.' },
          { text: 'Recommend spraying the granary with insecticide and changing nothing else.', correct: false, feedback: 'Spraying alone does not address the rodents, the floor-level storage, or moisture, and risks chemical residue on food grain. The whole storage system needs fixing.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'The recommended maize spacing in the Cereal GAP manual is:', options: ['20 cm between seeds, 60 cm between rows', '30 cm between seeds, 75 cm between rows', '50 cm between seeds, 100 cm between rows', '10 cm between seeds, 30 cm between rows'], answer: 1 },
    { q: 'The target maize plant population for optimum yield is about:', options: ['5,000-8,000 plants/acre', '18,000-21,000 plants/acre', '40,000-50,000 plants/acre', 'As many as possible'], answer: 1 },
    { q: 'Basal fertiliser should be placed:', options: ['In the same hole touching the seed', 'About 5 cm below and 5 cm to the side of the seed', 'On the soil surface after planting', 'Only as a foliar spray'], answer: 1 },
    { q: 'The three pillars of Climate-Smart Agriculture are:', options: ['Land, labour, capital', 'Adaptation, mitigation, productivity', 'Seed, soil, water', 'Inputs, outputs, profit'], answer: 1 },
    { q: 'Conservation Agriculture is defined by:', options: ['Maximum ploughing for a fine seedbed', 'Minimum soil disturbance, residue cover, and crop rotation/intercropping', 'Burning crop residues before planting', 'Continuous monocropping'], answer: 1 },
    { q: 'Fanya juu / fanya chini structures are a form of:', options: ['Hermetic storage', 'Soil-smart terracing to reduce runoff and erosion', 'Pest trap', 'Irrigation pump'], answer: 1 },
    { q: 'Orange-flesh sweet potato (OFSP) is promoted mainly because it is rich in:', options: ['Protein', 'Beta-carotene (vitamin A)', 'Iron only', 'Caffeine'], answer: 1 },
    { q: 'The most serious pest of sweet potato is the:', options: ['Fall armyworm', 'Sweet potato weevil', 'Maize stem borer', 'Aphid'], answer: 1 },
    { q: 'Yield decline in saved sweet potato vines over several seasons is mainly caused by:', options: ['Loss of soil fertility', 'Silent build-up of viruses in the planting material', 'Too much rainfall', 'Over-fertilisation'], answer: 1 },
    { q: 'The two key planning tools of a Level A (farming-as-a-business) farmer are:', options: ['A tractor and a sprayer', 'A crop calendar and a business plan', 'A passbook and a cash box', 'A soil test and a weather app'], answer: 1 },
    { q: 'A standard VSLA group is made up of:', options: ['2 to 5 members', '15 to 25 members', '50 to 100 members', 'Any number'], answer: 1 },
    { q: 'In a VSLA, the lockable cash box is secured by:', options: ['A single padlock and one key-holder', 'Three padlocks held by three different key-holders', 'A combination lock known to the chairperson only', 'No lock — trust-based'], answer: 1 },
    { q: 'Without intervention, stored maize losses on Kenyan farms within 6 months are typically:', options: ['Under 5%', '20-30%', 'Exactly 50%', 'Negligible'], answer: 1 },
    { q: 'Hermetic storage bags reduce insect losses by:', options: ['Adding strong chemical fumigants', 'Creating an airtight low-oxygen environment that suffocates insects', 'Freezing the grain', 'Exposing grain to sunlight'], answer: 1 },
    { q: 'Boiling orange-flesh sweet potato instead of steaming or roasting:', options: ['Increases its vitamin A content', 'Loses about 20-25% of its carotenoids', 'Has no effect on nutrients', 'Makes it toxic'], answer: 1 },
  ],
});


COURSES.push({
  id: 'gold',
  title: 'Gold: Responsible Artisanal & Small-Scale Mining',
  subtitle: 'Safety, mercury reduction, ESG and miner welfare',
  category: 'Commodities',
  icon: commodityIcon(goldIcon),
  duration: '1 hr 25 min',
  description: 'A seven-module summary of Solidaridad ECA\'s responsible artisanal and small-scale gold mining (ASGM) curriculum — drawn from occupational health and safety, emergency rescue and first aid, mine design, mercury reduction and ESG, self-regulation and formalisation, and governance and financial management training developed with miners in Busia, Kassanda, Migori, Geita and beyond. Designed for staff who support mining organisations (ASMOs), associations, and cooperatives.',
  lessons: [
    {
      id: 'gold-overview',
      title: 'Module 1 — ASGM & Solidaridad\'s Responsible Mining Work',
      content: [
        { type: 'p', text: 'Artisanal and small-scale gold mining (ASGM) is a livelihood for millions across East and Central Africa. It is low-capital, labour-intensive, and largely informal — and it is exactly that informality that drives the safety, health, environmental, and governance problems Solidaridad\'s work addresses. This course is a working summary of the ASGM curriculum Solidaridad ECA uses with mining organisations.' },
        { type: 'h', text: 'Why ASGM matters' },
        { type: 'list', items: [
          'Africa produces about 24% of the world\'s gold, with mining in at least 34 countries',
          'Global ASM employment is estimated at 20-40 million miners; 150-270 million people depend on ASM across 81 countries',
          'Uganda has close to 300,000 miners, of which around 31,000 are artisanal gold miners',
          'Kenya\'s ASM sector supports over 800,000 beneficiaries, with over 40,000 directly employed in ASGM',
          'Pact estimates 90% of extractive-sector workers are in artisanal mining, only 10% in industrial mining',
        ]},
        { type: 'h', text: 'The informality problem' },
        { type: 'stat', number: '70-80%', label: 'Of small-scale miners are informal', detail: 'Ranging from subsistence farmers to skilled migrants — driving low technology adoption, low capital, and weak safety' },
        { type: 'p', text: 'The sector is plagued by low formalisation, simple exploration and processing methods, environmental degradation, unsafe working conditions, accidents, mercury pollution, and weak access to finance. Almost every harm this course addresses traces back to informality.' },
        { type: 'callout', text: 'Formalisation is not paperwork for its own sake. A licensed, organised, record-keeping ASMO can access finance, premium markets, and a social licence to operate. An informal site cannot.' },
        { type: 'h', text: 'Solidaridad\'s ASGM approach' },
        { type: 'p', text: 'Solidaridad ECA works with artisanal and small-scale mining organisations (ASMOs) — associations and cooperatives such as those in Busia (Uganda), Kassanda under the Mubende United Miners\' Assembly (MUMA), and groups in Migori, Geita and across the region. The model combines occupational health and safety, mercury reduction, ESG integration, self-regulation, and governance and financial-management capacity building.' },
        { type: 'pathway', title: 'AVOID. PROTECT. MITIGATE.', text: 'The OHS hierarchy at the centre of the curriculum: AVOID hazards where you can, PROTECT workers where you cannot, and MITIGATE harm when incidents occur. Every safety decision maps onto one of these three.' },
        { type: 'pathway', title: 'ESG FRAMEWORK', text: 'Environmental, Social and Governance considerations are the lens for responsible mining — reducing environmental impact, protecting workers and communities, and building accountable, transparent organisations that investors and buyers can trust.' },
        { type: 'pathway', title: 'SELF-REGULATION', text: 'ASMOs take ownership of compliance through site-level committees and fortnightly self-assessments, rather than waiting for prescriptive inspection. It builds responsibility from within.' },
        { type: 'pathway', title: 'INCLUSION (EA$E)', text: 'The Economic and Social Empowerment (EA$E) approach builds women\'s financial literacy, savings, and group governance — turning informal women miners into organised groups that manage capital. The Mama Safi women\'s group in Buziba is the flagship story of change.' },
        { type: 'highlight', text: 'ASGM is high-risk and high-potential. Responsible mining turns a hazardous, informal livelihood into a safe, formal, dignified one.' },
      ],
    },
    {
      id: 'gold-ohs',
      title: 'Module 2 — Occupational Health & Safety: Hazards & the Mining Cycle',
      content: [
        { type: 'p', text: 'Occupational Health and Safety (OHS, also OSH) is the discipline of preventing work-related injury and disease and promoting workers\' physical, mental, and social wellbeing. In ASGM the gold value chain runs from cuts and bruises to mineshaft collapse, mercury poisoning, and death. Getting OHS right is the foundation of everything else.' },
        { type: 'h', text: 'Why accidents happen' },
        { type: 'pathway', title: 'HUMAN FACTORS', text: 'Carelessness, poor safety culture, misreading danger, lack of training, working under the influence. Fixed by sensitisation, continuous training, site bye-laws with enforced penalties, and matching tasks to ability.' },
        { type: 'pathway', title: 'TECHNICAL FACTORS', text: 'Wrong tools, faulty or poorly installed equipment, no know-how. Fixed by selecting the right tools, regular inspection and maintenance, engineering controls (e.g. conveyor guards), and trained-only operation.' },
        { type: 'pathway', title: 'WORKING-ENVIRONMENT FACTORS', text: 'Disorganised, unhygienic, hostile sites. Fixed by orderliness, good housekeeping, clear unobstructed access, and a culture of safety.' },
        { type: 'h', text: 'Hazard vs risk' },
        { type: 'p', text: 'A hazard is anything with the potential to cause harm. A risk is the likelihood that the hazard will actually affect someone. For a hazard to create a risk, three things must coincide: the hazard, an exposure pathway, and a receptor (a person). Remove any one and the risk disappears.' },
        { type: 'list', items: [
          'Physical hazards — pit/tunnel collapse, heat stress, vibration, dust, noise, flooding',
          'Ergonomic hazards — awkward posture, repetitive motion, lifting beyond capacity (back injury, disability)',
          'Mechanical hazards — tool/equipment malfunction, flying rock fragments, loss of fingers or limbs',
          'Chemical hazards — mercury and cyanide in processing, diesel fumes, trapped gases',
          'Intoxication hazards — alcohol and narcotics underground are potentially fatal',
          'Sanitation hazards — no latrines or clean water breeds cholera, diarrhoea, typhoid',
          'Psychosocial hazards — stress, violence, harassment, fatigue, depression',
        ]},
        { type: 'h', text: 'Hazard assessment' },
        { type: 'p', text: 'Every mine must have someone designated to identify and remove hazards at every working section. A full assessment takes a day or a few days but its benefit lasts years. The three steps are identification, evaluation, and control. Reassess whenever a new process is introduced, an operation changes, a major addition is built, or at regular intervals.' },
        { type: 'p', text: 'Risk is then scored on two axes: probability (frequent, likely, occasional, seldom, improbable) and impact (catastrophic, critical, moderate, minor, negligible). This drives the risk-management cycle: identification, assessment, mitigation, contingency planning, and tracking/reporting.' },
        { type: 'h', text: 'The mining cycle and its risks' },
        { type: 'value', title: '1. PROSPECTING / EXPLORATION', text: 'Mapping, surveying, sampling soil and water, drilling. Risks: cuts, bruises, dehydration, snakes. Use gloves, goggles, helmet, hi-vis jacket; carry a first-aid kit and water; backfill sample pits when done.' },
        { type: 'value', title: '2. MINING (SURFACE / UNDERGROUND)', text: 'Overburden removal, shaft sinking, ore extraction, loading and hauling. Risks: rock falls, wall collapse, dust (silicosis), noise, heat, electrocution, vibration white finger, suffocation. The highest-fatality stage.' },
        { type: 'value', title: '3. MINERAL PROCESSING', text: 'Drying, milling, sluicing, panning, amalgamation. Risks: noise and dust from ball mills, cuts, ergonomic and heat stress, mercury and cyanide exposure, waste run-off.' },
        { type: 'value', title: '4. RECLAMATION & CLOSURE', text: 'Abandoned pits collect stagnant water (malaria), cause falls, and become sanitation and security hazards. Do progressive reclamation as sections are exhausted; fence and sign what is not yet closed.' },
        { type: 'callout', text: 'Most deaths in underground ASGM are caused by suffocation from lack of oxygen or gas poisoning. Plan ventilation at the earliest stage — never as an afterthought.' },
        { type: 'h', text: 'Personal protective equipment (PPE)' },
        { type: 'p', text: 'PPE is the last line of defence, not the first. It must be appropriate to the hazard, the right size and fit, used correctly, kept clean and in good order, and issued against a signed record. Match the PPE to the risk:' },
        { type: 'list', items: [
          'Dust — respiratory and eye protection (face masks, goggles)',
          'Falling rocks — helmet and gumboots',
          'Rock cuts and sharp rocks — overalls, heavy-duty gloves, helmet, gumboots',
          'Noise (jack hammer, generator) — ear muffs/plugs whenever you must raise your voice to be heard 1 m away',
          'Chemicals (mercury, cyanide) — respiratory protection and heavy-duty gloves',
          'Heat and sun — broad-brimmed hat, long sleeves, drinking water, frequent breaks',
          'Footwear — impenetrable sole and steel toe cap',
        ]},
        { type: 'callout', text: 'Jack hammers and concrete breakers must never be operated by one person for more than 6 months — vibration white finger causes permanent damage. Rotate operators and watch for numbness, tingling, or whitening fingers.' },
        { type: 'highlight', text: 'Find the hazard, break the pathway, protect the receptor. OHS is not luck — it is a system you build and run every day.' },
      ],
    },
    {
      id: 'gold-design',
      title: 'Module 3 — Mine Design, Systems of Production & Mercury Reduction',
      content: [
        { type: 'p', text: 'Safe, efficient mining starts with how the mine is designed and how production flows. The method must fit the ore body — its shape, depth, rock strength, and mineral distribution. Get the design right and you reduce collapse, flooding, and waste in one move.' },
        { type: 'h', text: 'Surface vs underground' },
        { type: 'pathway', title: 'SURFACE / OPEN-PIT', text: 'For near-surface deposits with a low stripping ratio, large extension, and fairly uniform ore. Two steps: overburden stripping, then mining the deposit. Higher productivity, lower operating cost per tonne, safer, but more waste rock and higher environmental impact.' },
        { type: 'pathway', title: 'UNDERGROUND', text: 'For deposits beyond the break-even depth (where mining cost equals the price fetched), or deep, narrow, vein-concentrated ore. Vertical and horizontal tunnels and adits. Lower waste, but far higher OHS risk — ventilation, support, and access are critical.' },
        { type: 'p', text: 'A stripping ratio of 2:1 means twice as much waste rock is moved as ore. Open-pit deposits are mined in benches (steps); the key open-pit terms are bench, bench height and width, crest, toe, face angle, bench slope (bank angle), and berm — the horizontal shelf left within the pit wall to improve slope stability and safety.' },
        { type: 'h', text: 'Building a safe shaft and stope' },
        { type: 'list', items: [
          'Remove large bushes and trees before stripping overburden',
          'Strip overburden at least 3 m back from the pit-wall edge',
          'Stockpile overburden at least 10 m from the pit wall, at about a 35-degree angle, and keep it stable',
          'Never undercut the overburden',
          'Provide at least two ways to access/exit every working block — for ventilation and emergency escape',
          'Use timbering (planking and strutting) for weak or fractured rock; the weaker the rock, the closer the spacing',
          'Treat and regularly inspect timber — it breaks down over time and under load',
          'Dig trenches to divert surface run-off away from the shaft; dewater continuously to prevent flooding',
        ]},
        { type: 'callout', text: 'Rock-fall and collapse risk rises sharply when water seeps through rock into tunnels. Watch for progressive fracturing in walls, small rocks falling, and surface cracks — these are warnings, not nuisances.' },
        { type: 'h', text: 'A typical ASGM system of production' },
        { type: 'p', text: 'For Busia artisan miners, production flows through clear stages, with members present at each to ensure safety and protect the integrity of their ore:' },
        { type: 'list', items: [
          'Stage 1 — Mining: collective extraction from open or underground pits, transport to store (axes, spades, pick axes, hoes, crow bars, wheelbarrows)',
          'Stage 2 — Milling: ore is dried then fed to a ball mill (often hired from a processing centre by groups without their own)',
          'Stage 3 — Sluicing and panning: milled ore is concentrated; gold and heavy particles settle on a carpet/blanket while gangue washes away',
          'Stage 4 — Amalgamation and burning: mercury binds the gold; amalgam is burnt in a retort to expel mercury and leave gold',
        ]},
        { type: 'h', text: 'Mercury: the central environmental hazard' },
        { type: 'p', text: 'Mercury amalgamation is the most common — and most dangerous — recovery method. Mercury is most dangerous as a vapour: inhaled during amalgam burning, it travels long distances and settles on crops and water, entering the food chain. Impacts are gradual and easy to ignore until it is too late.' },
        { type: 'list', items: [
          'Symptoms: bluish gums, metallic/sour mouth, memory and eyesight loss, muscle tremors, hallucinations, depression, miscarriage and birth defects',
          'Mercury attacks the nervous system; prolonged exposure damages kidneys and impairs hearing, vision, and balance',
          'Children can be exposed from birth — never allow children or pregnant women where mercury is handled or burnt',
        ]},
        { type: 'callout', text: 'Uganda\'s Mining and Minerals Act 2022, Section 255, prohibits mercury use and unauthorised cyanide use — with a fine of 5,000 currency points (about 100 million shillings), three years\' imprisonment, or both. Uganda ratified the Minamata Convention on Mercury in March 2019.' },
        { type: 'h', text: 'Reducing mercury — practical steps' },
        { type: 'value', title: 'CONTAIN', text: 'Amalgamate and pan only in a closed tank or excavated pond — never near rivers or wetlands. Only amalgamate the concentrate, and never use more mercury than required.' },
        { type: 'value', title: 'RETORT', text: 'Always burn amalgam in a retort in a well-ventilated area; it captures and condenses the vapour. Wait for the retort to cool before opening to avoid burns. Wear gloves, mask, and overalls.' },
        { type: 'value', title: 'BORAX METHOD', text: 'A mercury-free alternative. Mix equal parts borax and concentrate (e.g. 50 g to 50 g), bag it, and smelt in a pre-heated clay crucible at high temperature. Borax also seals crucible cracks. Yields a gold button once cooled.' },
        { type: 'value', title: 'CYANIDE (AUTHORISED ONLY)', text: 'Cyanide dissolves gold and is applied to tailings, but it kills at very low concentrations and is acutely toxic. Only permitted, authorised, trained persons may handle it.' },
        { type: 'highlight', text: 'Design the mine for the ore body, run production in safe stages, and contain or eliminate mercury. Responsible processing is both safer and more bankable.' },
      ],
    },
    {
      id: 'gold-emergency',
      title: 'Module 4 — Emergency Rescue & First Aid',
      content: [
        { type: 'p', text: 'When danger strikes underground, a speedy, safe rescue is the difference between life and death for trapped miners. First aid is the immediate, temporary care given before professional help arrives. Every site must be ready — yet field studies at MUMA found no mine pit had a first-aid kit or trained personnel, with miners wrapping wounds in unclean cloths that cause infection.' },
        { type: 'h', text: 'The mine rescue plan' },
        { type: 'p', text: 'A rescue plan is the set of precautions and trained capacity in place to carry out immediate rescue. Rescuers must be available and ready at a moment\'s notice. The minimum equipment list:' },
        { type: 'list', items: [
          'Self-contained breathing apparatus and spare oxygen cylinders, pump/cascade system and testing kit',
          'Cap lamps and chargers; multi-gas detectors',
          'Lightweight stretchers; first-aid bag and supplies; PPE',
          'Effective portable communication system and a transport system',
          'A trained health officer',
          'Different, well-labelled mine exits and ladders for underground mines',
          'An accident reporting mechanism',
        ]},
        { type: 'h', text: 'Managing the emergency scene' },
        { type: 'p', text: 'The safety of the rescuer comes first, always. A scene may be dangerous on arrival or become dangerous while you work.' },
        { type: 'list', items: [
          'Approach cautiously; fully evaluate the scene for your safety and others\' before acting',
          'If the scene appears unsafe at any time, retreat to a safe location',
          'Never enter a dangerous scene without qualified help (mine foreman, electrician)',
          'Never attempt anything you are not trained to do',
          'Discourage others from entering an unsafe area',
          'Never move a patient before treating and stabilising — unless an immediate danger threatens them or you',
        ]},
        { type: 'callout', text: 'Standard of care, negligence, and consent are real legal concepts. Negligence requires four factors: a duty to respond, breach of that duty, actions that cause harm or improper care, and resulting damage. Provide care to your level of training — and get consent where you can.' },
        { type: 'h', text: 'The primary survey: ABC' },
        { type: 'p', text: 'A primary survey treats life-threatening problems first — airway, breathing, circulation, and bleeding. A secondary survey then addresses wounds, fractures, shock, dislocations, stabilisation, and transport.' },
        { type: 'value', title: 'AIRWAY', text: 'Open and clear the airway. A blocked airway kills in minutes.' },
        { type: 'value', title: 'BREATHING', text: 'Check the patient is breathing; if not, provide rescue breathing within your training.' },
        { type: 'value', title: 'CIRCULATION', text: 'Check circulation and control bleeding with direct pressure, elevation, and pressure points.' },
        { type: 'value', title: 'RECOVERY POSITION', text: 'Place an unconscious but breathing patient in the recovery position to keep the airway clear.' },
        { type: 'h', text: 'Common mine injuries' },
        { type: 'list', items: [
          'Open wounds (abrasion, laceration, avulsion, amputation, puncture) — control bleeding first, do not waste time washing; cover with sterile dressing and bandage',
          'Impaled objects — never remove (except the cheek if it blocks breathing); stabilise with bulky dressings',
          'Burns — cool with large amounts of cold water (never ice except small 1st-degree burns); cover with sterile material; never apply oil, butter, or break blisters; treat for shock',
          'Head and spine injuries — always treat as serious; altered consciousness is the first and most important sign of serious head injury; do not move unnecessarily',
          'Heart attack — rest the patient, call advanced help, assist with prescribed medication, monitor vitals',
          'Fainting, stroke, poisoning (ingested, inhaled, absorbed), snake and spider bites',
        ]},
        { type: 'callout', text: 'Hepatitis B is up to 100 times more easily spread than HIV. One teaspoon of contaminated blood holds at least half a million Hepatitis B particles. Treat all blood as infectious, use gloves, and get vaccinated.' },
        { type: 'h', text: 'The first-aid kit and records' },
        { type: 'p', text: 'Every site must keep a stocked first-aid kit — plasters, sterile gauze and dressings, triangular and crepe bandages, splint, cold compress, scissors, tweezers, safety pins, sterile gloves, antiseptic cream, eye wash, thermometer, thermal blanket. Keep first-aid records of every incident, and electrical burns must always be treated as life-threatening because the heart and breathing may be affected even in a conscious patient.' },
        { type: 'highlight', text: 'Rescuer safety first, then ABC. A trained responder and a stocked kit on every site turn fatal incidents into survivable ones.' },
      ],
    },
    {
      id: 'gold-esg',
      title: 'Module 5 — ESG: Social & Governance Integration',
      content: [
        { type: 'p', text: 'Environmental, Social and Governance (ESG) is the framework for assessing a mining entity\'s business practices and impact — on the environment, on the people it works with (employees, suppliers, communities), and on the quality of its own leadership, controls, and accountability. For ASMOs, ESG is the path to finance, premium prices, and a social licence to operate.' },
        { type: 'h', text: 'Why ESG pays for ASGM' },
        { type: 'list', items: [
          'Healthier, safer workplaces — better worker health and morale',
          'Effective risk mitigation — more resilient, better able to anticipate regulation',
          'Improved governance — ethical practice and accountability raise investor confidence',
          'Better access to credit — most banks and financiers have specific ESG requirements',
          'Premium prices — buyers pay more for gold produced to ESG standards',
          'Social Licence to Operate (SLO) — stronger relationships with community, regulators, and customers',
        ]},
        { type: 'h', text: 'Pillar 1 — Environmental' },
        { type: 'p', text: 'Predict and manage environmental impacts across the whole mine life (prospecting, development, extraction, closure). In Kenya, projects must undergo an environmental impact assessment before proceeding; the Mining Act 2016 requires operations that protect and conserve the environment, and failure can revoke a permit.' },
        { type: 'list', items: [
          'Conduct environmental impact assessments before starting, and annual audits',
          'Develop and implement an environmental monitoring and a site-rehabilitation plan',
          'Treat and recycle wastewater; safely dispose of chemicals, tailings, and wastewater',
          'Contract a licensed (NEMA) waste handler for hazardous waste; separate mercury-containing tailings from non-mercury',
          'Label all chemicals; conduct waste separation; inspect and service machinery',
          'Adopt mercury-free processing technologies wherever possible',
        ]},
        { type: 'h', text: 'Pillar 2 — Social' },
        { type: 'p', text: 'The social pillar covers how an entity manages relationships with employees and communities: workplace health and safety, labour standards, human rights, inclusion and diversity, and community relations.' },
        { type: 'list', items: [
          'Register the workplace with the occupational safety authority (e.g. DOSHS in Kenya)',
          'Have emergency response plans for fires, explosions, and cave-ins; train regularly',
          'Provide PPE, sanitary facilities, adequate lighting and ventilation; insure workers (e.g. WIBA)',
          'Report injuries and accidents to the authority; keep workplaces clean and free of effluent',
          'Respect labour rights — fair wages, contracts, freedom of association, dispute resolution',
          'No discrimination on any ground; a workplace free of sexual harassment; equal opportunity for women and men',
          'Build community relations through CSR, community development, and environmental conservation',
        ]},
        { type: 'h', text: 'Pillar 3 — Governance' },
        { type: 'p', text: 'Governance is how a mining entity is managed and controlled — built on accountability, transparency, and decisions that create long-term value. Good governance in ESG rests on four legs: regulatory compliance, stakeholder rights and transparency, internal policies and controls, and board structure and independence.' },
        { type: 'pathway', title: 'INTERNAL CONTROLS', text: 'Three levels: entity-level (rules for board, management, staff), transactional-level (catch errors and fraud in financial processes), and monitoring controls (track the project after implementation). Examples: authorising invoices, verifying expenses, internal/external audits, inventory counts.' },
        { type: 'pathway', title: 'WRITTEN POLICIES', text: 'Have them in writing: anti-harassment, anti-corruption, workplace safety, code of conduct, grievance redress, gender-based violence and gender policy, data protection, HR, and a record of meetings.' },
        { type: 'callout', text: 'Know the laws by stage. In Kenya: exploration and extraction engage the Mining Act, EMCA (ESIA/audit), OSHA, WIBA, Labour Act, Water Act, and the Explosives Act — and no one may use blasting materials at 10 m depth or more without a valid miner\'s blasting certificate.' },
        { type: 'h', text: 'Integrating governance in practice' },
        { type: 'list', items: [
          'Obtain a certificate/letter of registration; register a bank account for the entity',
          'Pay royalties and keep receipts; file returns and obtain a tax-compliance certificate',
          'Develop an organogram and keep an index of leadership (name, contact, ID, position)',
          'Acquire land-owner/shaft-owner agreements and partnership agreements',
          'Obtain and renew all applicable permits and licences; conduct financial audits and keep records',
        ]},
        { type: 'highlight', text: 'ESG is not a cost — it is the entry ticket to finance and markets. Reduce impact, protect people, govern transparently.' },
      ],
    },
    {
      id: 'gold-selfreg',
      title: 'Module 6 — ASM Self-Regulation & Formalisation',
      content: [
        { type: 'p', text: 'Self-regulation lets ASM right holders take ownership of compliance and promote responsible mining without waiting for prescriptive, top-down inspection. It empowers miners to proactively align with the law, prevent avoidable accidents, and build credibility — while easing the burden on stretched government inspectors.' },
        { type: 'h', text: 'Why self-regulation' },
        { type: 'p', text: 'The ASM sector faces perennial challenges — environmental degradation, unsafe conditions, inefficient operations, accidents, non-compliance, limited finance, disregard for human rights, gender concerns, and land conflicts. Self-regulation is built on the rule of law, participation and inclusivity, gender inclusivity, a human-rights-based approach, integrity, transparency and accountability, and sustainable development.' },
        { type: 'pathway', title: 'EFFICIENT MINING', text: 'Promote effective, efficient mining operations — good mining practice, no wasteful mining or treatment, regard for the environment.' },
        { type: 'pathway', title: 'ENVIRONMENT, HEALTH & SAFETY', text: 'Promote environmental, health and safety protection across all stages of the mine cycle.' },
        { type: 'pathway', title: 'SOCIAL RESPONSIBILITY', text: 'Strengthen social responsibility and stakeholder engagement, with consent from affected communities and insurance cover for employees\' health and safety.' },
        { type: 'h', text: 'The self-regulatory committee' },
        { type: 'p', text: 'Every ASM right holder establishes a site-level self-regulatory committee, observing the gender rule. Its composition typically includes a chair, secretary, and treasurer, plus members with knowledge in environment, mine health and safety, and social safeguards, a mine support-service representative, and a worker representative — and may co-opt government or expert members.' },
        { type: 'list', items: [
          'Establish a schedule of self-assessments for the year',
          'Conduct mine self-assessments at least once every two weeks, using the inspector\'s checklist',
          'Provide written recommendations to the right holder on issues needing action',
          'Identify occupational and environmental risks and track corrective action',
        ]},
        { type: 'h', text: 'The self-assessment scorecard' },
        { type: 'p', text: 'The self-regulation toolkit is a scored checklist (typically 1-4) covering the full picture of a responsible site. Staff use it with ASMOs to baseline, track progress, and prioritise improvements:' },
        { type: 'value', title: 'FORMALISATION STATUS', text: 'Does the site have an MEMD licence? Do members belong to an association? Does the association have a constitution and clear leadership? Is it registered at sub-county/district level, registered as a company (URSB), operating a bank account, and filing returns?' },
        { type: 'value', title: 'TAILINGS MANAGEMENT', text: 'Designated waste-collection points; a well-insulated tailings dam or a barrier to stop run-off seeping into soil and water; a register tracking tailings bought and taken off-site for processing.' },
        { type: 'value', title: 'MERCURY MANAGEMENT', text: 'Do heaters handle amalgam with bare hands? Is heating done indoors or with a retort? Does the person heating wear a mask? Each answer scores the site\'s mercury risk.' },
        { type: 'value', title: 'HEALTH, SAFETY & SOCIAL', text: 'PPE issuance and use, sanitary facilities, first-aid readiness, child-labour prevention, grievance mechanisms, and community agreements.' },
        { type: 'callout', text: 'Formalisation is the foundation. A site with a licence, a registered association, a constitution, a bank account, and filed returns can access the 10% government development fund and other finance. Without documentation, those doors stay shut — exactly the barrier Mama Safi broke through.' },
        { type: 'h', text: 'The legal backbone' },
        { type: 'p', text: 'Self-regulation does not replace the law — it operationalises it. The Mining Act (Kenya, Cap 306) requires an artisanal mining permit, good mining practice, health and safety rules, and environmental protection; private-land mining needs the registered owner\'s consent (not to be unreasonably withheld) or a compensation agreement; and right holders must maintain insurance for employees\' health and safety.' },
        { type: 'highlight', text: 'Self-regulation turns compliance from something done to miners into something owned by miners. Fortnightly self-assessment is how a site proves it is responsible.' },
      ],
    },
    {
      id: 'gold-governance',
      title: 'Module 7 — Governance, Financial Management & Inclusion',
      content: [
        { type: 'p', text: 'An ASMO is an organisation — a structured group with a common purpose, defined roles, and agreed systems. Whether it succeeds or fails comes down to governance: how decisions are made, who makes them, how stakeholders have a say, and how decision-makers are held to account. Strong governance and sound financial management are what let a group of miners manage capital and grow.' },
        { type: 'h', text: 'What defines a strong organisation' },
        { type: 'p', text: 'Organisations are defined by purpose (why we come together), structure and systems (how we organise and what guides us), and people (who our members are). Good ones share a clear vision and mission, common goals, clear systems and policies, defined structures, active member participation, visionary leadership, and accountability.' },
        { type: 'pathway', title: 'GOVERNANCE (THE BOARD)', text: 'The board governs — it acts as trustee of the organisation\'s assets, sets mission and policy, provides fiscal oversight, and ensures the organisation is well managed and fiscally sound. Its work is foresight, oversight, and insight.' },
        { type: 'pathway', title: 'MANAGEMENT', text: 'Management runs day-to-day operations — planning, organising, coordinating, controlling resources, and implementing the board\'s decisions. Authority can be delegated, but responsibility stays with the chief executive acting for the board.' },
        { type: 'h', text: 'Key roles' },
        { type: 'list', items: [
          'Chairperson — leads and chairs board and committee meetings',
          'Secretary — attends all meetings, takes and safeguards minutes, gives notice and agendas',
          'Treasurer — chairs the finance committee, understands the accounts, presents the annual budget, reviews the audit',
          'Board composition — integrity and skills, plus constituency, gender, age, and ethnic diversity; at least one member with a finance/accounting background',
        ]},
        { type: 'h', text: 'Financial management' },
        { type: 'value', title: 'BUDGETING', text: 'A planning tool to forecast revenue and expenses — accurate, specific, and easy to understand. It gives control over money, helps decide if and how much to borrow, and enables saving for expected and unexpected costs.' },
        { type: 'value', title: 'ACCOUNTING', text: 'Recording all financial transactions in the period they occur, consistently, backed by evidence, with revenue and expenditure recorded together.' },
        { type: 'value', title: 'MONITORING & REPORTING', text: 'Track expenditure against budget and report income, expenditure, assets, and liabilities to internal and external stakeholders.' },
        { type: 'value', title: 'AUDIT', text: 'An independent examination of financial information to confirm a true and fair view and to test internal controls.' },
        { type: 'callout', text: 'Always separate personal and official money. Keep records safely for at least 5 years, file annual returns on time, and monitor performance continuously. Mixing personal and group funds is the fastest way to destroy member trust.' },
        { type: 'h', text: 'Savings, loans, and record keeping' },
        { type: 'p', text: 'Savings is deliberately setting money aside for the future — for emergencies, expected costs, or assets. Even small amounts add up: 100/- saved a day becomes 36,000/- a year. A good loan creates assets and income and is used for its intended purpose; a bad loan is misused, too small to finish the job, or carries high interest. Good record keeping makes all of this possible — it lets you compute profit (sales minus costs), avoid overspending, prepare for audits, and calculate tax.' },
        { type: 'h', text: 'Inclusion in practice — the Mama Safi story of change' },
        { type: 'p', text: 'At Mlela Mine in Buziba, women had long worked the ASGM economy informally and insecurely. In 2025, under Solidaridad\'s EA$E initiative, the 20-member Mama Safi women\'s group was formed to strengthen women\'s economic participation. The first shift was mindset, not money: capacity building in business management, financial literacy, and record keeping.' },
        { type: 'list', items: [
          'They established leadership roles, kept meeting minutes, recorded savings, and tracked internal lending',
          'With proper records and a business plan, they accessed the government 10% development fund — securing a TZS 7 million loan once they could show financial discipline and transparency',
          'They invested in diversified assets: a 3-hectare maize farm, seven goats, and an internal lending scheme for members',
          'Members started restaurants near the mines, poultry farming, and waste-rock processing — repaying loans consistently',
          'Household impact: three meals a day, school fees paid on time, reduced financial stress, stronger decision-making power for women',
          'Three more women\'s groups have been inspired to follow, assessed positively by local government for the next loans',
        ]},
        { type: 'callout', text: 'Mama Safi\'s lesson: access to finance alone is not enough. Capacity building, financial literacy, governance, and mindset change are the enablers that turn informal labourers into organised groups that manage capital and deliver returns.' },
        { type: 'highlight', text: 'Govern transparently, manage money with records, and include women fully. When miners are organised and accountable, they do not merely survive — they lead, invest, and inspire.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six ASGM Field Scenarios',
    scenarios: [
      {
        situation: 'During a site visit you watch a "heater" burning gold amalgam on a spoon over an open gas stove in the middle of the processing area, with two other miners and a child standing nearby. The group says this is how they have always done it.',
        options: [
          { text: 'Note it as normal practice — open burning is traditional and the group is comfortable with it.', correct: false, feedback: 'Mercury is most dangerous as a vapour. Open burning poisons the heater, everyone nearby, and the child especially — and the vapour settles on crops and water far beyond the site. This is exactly what must change.' },
          { text: 'Stop the open burning. Move children and any pregnant women away immediately, then introduce a retort used in a well-ventilated area so the vapour is captured and condensed, with gloves and a mask — and raise the borax method as a mercury-free alternative.', correct: true, feedback: 'Correct. A retort captures mercury vapour and is the immediate harm-reduction step; borax processing removes mercury entirely. Children and pregnant women must never be present where amalgam is handled or burnt. Note too that mercury use is prohibited under Uganda\'s Mining and Minerals Act 2022.' },
          { text: 'Tell them to keep burning but to stand slightly further back.', correct: false, feedback: 'Distance does almost nothing against mercury vapour, which travels long distances. The fix is containment (retort) or elimination (borax), plus removing vulnerable people — not a few extra steps back.' },
        ],
      },
      {
        situation: 'An ASMO wants to deepen an underground shaft quickly to chase a rich vein. The site has a single access shaft, no timbering in the new section, and water has begun seeping through the walls. The leader asks you to sign off on continuing.',
        options: [
          { text: 'Approve — the vein is rich and speed matters; support and ventilation can be added later.', correct: false, feedback: 'Most ASGM deaths underground are from suffocation or collapse. Water seepage sharply raises collapse risk, a single shaft means no escape route or ventilation, and unsupported weak rock is a cave-in waiting to happen. Signing off here risks lives.' },
          { text: 'Do not approve until the controls are in place: a second access/exit for ventilation and escape, timbering sized to the rock (closer spacing for weaker rock), trenches and dewatering to manage the seepage, and regular inspection for progressive fracturing.', correct: true, feedback: 'Correct. Two exits, proper support, water diversion/dewatering, and inspection are non-negotiable for safe underground work. Water seepage and a single shaft are red flags. Safety controls come before production, not after.' },
          { text: 'Suggest they switch the whole operation to open-pit mining instead.', correct: false, feedback: 'Open-pit only suits near-surface, low-stripping-ratio deposits. A deep, narrow vein beyond break-even depth is an underground deposit. The answer is to make the underground work safe, not to abandon a viable method.' },
        ],
      },
      {
        situation: 'You arrive at a pit where a miner has been struck on the head by falling rock, is unconscious but breathing, and is lying at the bottom of a shaft where small rocks are still falling. Other miners want to immediately lift him out and pour water on a bleeding gash.',
        options: [
          { text: 'Help them lift him out fast and wash the wound — speed saves lives.', correct: false, feedback: 'Two errors. Rushing in while rocks fall endangers rescuers (rescuer safety comes first), and an unconscious head-injury patient may have a spine injury — moving him wrongly can cause paralysis. You also never waste time washing a wound; control bleeding instead.' },
          { text: 'Secure rescuer safety first — stop the rockfall hazard or wait until it is safe and get qualified help. Then run the primary survey (airway, breathing, circulation), control bleeding with direct pressure and a sterile dressing, treat the head injury as serious, avoid unnecessary movement, and arrange transport.', correct: true, feedback: 'Correct. Rescuer safety first, then ABC. Altered consciousness is the key sign of serious head injury; treat for spine injury and do not move unless an immediate danger forces it. Control bleeding by pressure, not washing.' },
          { text: 'Wrap the head in available cloth to stop the bleeding and let him come round on his own.', correct: false, feedback: 'Unclean cloth causes infection, and an unconscious head/spine-injury patient needs the airway managed, the spine protected, and advanced help — not to be left to "come round". This is the local practice the training is designed to replace.' },
        ],
      },
      {
        situation: 'A women miners\' group asks your help to access the government 10% development fund. They have energy and a viable plan, but no constitution, no bank account, no minutes, and no financial records. They ask whether they should just apply now and sort out paperwork later.',
        options: [
          { text: 'Encourage them to apply immediately — the plan is good and documentation can follow approval.', correct: false, feedback: 'This is exactly why women\'s groups have historically been turned away — weak documentation and no demonstrated financial management. Applying without records almost guarantees rejection and wasted effort.' },
          { text: 'Build the foundations first: capacity building in financial literacy and record keeping, establish leadership roles and minutes, record savings, register and open a bank account — then apply with proper records and a business plan, as Mama Safi did to secure their loan.', correct: true, feedback: 'Correct. Mama Safi\'s breakthrough came because they could demonstrate financial discipline, transparency, and a viable strategy. Access to finance alone is not enough — capacity, governance, and records are the enablers that unlock it.' },
          { text: 'Tell them the fund is realistically out of reach for informal women\'s groups and suggest they focus on daily mining income.', correct: false, feedback: 'Defeatist and wrong. Mama Safi proved organised women\'s groups can secure and repay government loans and inspire others. The barrier is documentation and organisation, both of which staff can help build.' },
        ],
      },
      {
        situation: 'An ASMO treasurer keeps the group\'s gold-sale proceeds together with his own money "to keep it safe", has no written records, and members are starting to grumble that they cannot see where money goes. The chair asks if this is a real problem.',
        options: [
          { text: 'Reassure the chair — as long as the treasurer is trusted, mixing funds and informal records is fine for a small group.', correct: false, feedback: 'Mixing personal and group funds with no records is the fastest way to destroy member trust and invite disputes. Trust is not a substitute for controls — it is built by them.' },
          { text: 'Treat it as a governance and financial-management failure: separate personal and official money completely, record every transaction with evidence, budget and monitor against it, and put basic internal controls in place (authorised payments, an audit). Keep records for at least 5 years.', correct: true, feedback: 'Correct. Separating funds, recording transactions, and basic internal controls are core financial-management practice. Records let the group compute profit, prepare for audit, and show members and financiers exactly where money goes — the credibility that unlocks finance.' },
          { text: 'Recommend the treasurer simply remember the figures and report them verbally at meetings.', correct: false, feedback: 'Memory is not a record. Without written, evidence-backed accounts there is no way to verify profit, satisfy an audit, compute tax, or rebuild member confidence. The problem is the absence of records, not how they are spoken.' },
        ],
      },
      {
        situation: 'A self-regulatory committee tells you they completed one self-assessment six months ago, scored poorly on tailings and PPE, filed it away, and have not revisited it. They feel they have "done" self-regulation.',
        options: [
          { text: 'Confirm they have met the requirement — a completed self-assessment on file is the goal.', correct: false, feedback: 'Self-regulation is a continuous process, not a one-off form. A scorecard filed away with no follow-up changes nothing on the ground — the tailings and PPE risks they identified are still harming people.' },
          { text: 'Reset the rhythm: self-assessments at least every two weeks using the inspector\'s checklist, written recommendations to the right holder after each, and tracked corrective action on the tailings and PPE gaps — turning the low scores into an improvement plan.', correct: true, feedback: 'Correct. The committee must self-assess at least fortnightly, recommend actions in writing, and track them to completion. The scorecard is a tool for continuous improvement and demonstrating responsibility — its value is in acting on it, not filing it.' },
          { text: 'Tell them to wait for the government inspector to come and tell them what to fix.', correct: false, feedback: 'That defeats the entire purpose of self-regulation, which is for miners to own compliance proactively rather than wait for prescriptive inspection. The committee already knows the gaps — it should act now.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'For a hazard to create a risk, three things must coincide:', options: ['Money, tools, and labour', 'A hazard, an exposure pathway, and a receptor (person)', 'Probability, impact, and cost', 'Mercury, cyanide, and dust'], answer: 1 },
    { q: 'The OHS hierarchy at the centre of the ASGM curriculum is:', options: ['Plan, do, check', 'Avoid, Protect, Mitigate', 'Identify, report, ignore', 'Mine, mill, sell'], answer: 1 },
    { q: 'Most deaths in underground ASGM operations are caused by:', options: ['Mercury poisoning', 'Suffocation from lack of oxygen or gas poisoning', 'Snake bites', 'Heat stress'], answer: 1 },
    { q: 'Jack hammers and concrete breakers should never be operated by one person for more than:', options: ['One week', 'One month', '6 months', '5 years'], answer: 2 },
    { q: 'Overburden should be stockpiled at least how far from the pit wall?', options: ['1 metre', '3 metres', '10 metres', '50 metres'], answer: 2 },
    { q: 'Mercury is most dangerous to human health when it is:', options: ['Solid', 'Mixed with water', 'A vapour (inhaled)', 'Cold'], answer: 2 },
    { q: 'The mercury-free gold-processing method that mixes equal parts of a substance with the concentrate and smelts it is the:', options: ['Cyanide leach method', 'Borax method', 'Amalgamation method', 'Sluicing method'], answer: 1 },
    { q: 'In first aid, the primary survey treats life-threatening problems in this order:', options: ['Bandage, splint, transport', 'Airway, Breathing, Circulation', 'Wash, dress, elevate', 'Call, wait, observe'], answer: 1 },
    { q: 'When treating an open wound, you should first:', options: ['Wash the wound thoroughly', 'Control bleeding with direct pressure and a sterile dressing', 'Apply oil or butter', 'Remove any impaled object'], answer: 1 },
    { q: 'The three pillars of ESG are:', options: ['Exploration, Mining, Processing', 'Environmental, Social, Governance', 'Profit, People, Product', 'Land, Labour, Capital'], answer: 1 },
    { q: 'A self-regulatory committee should conduct mine self-assessments at least:', options: ['Once a year', 'Once every two weeks', 'Only when an inspector visits', 'Once every five years'], answer: 1 },
    { q: 'Under Uganda\'s Mining and Minerals Act 2022, mercury use in mining operations is:', options: ['Encouraged', 'Prohibited, with heavy fines and possible imprisonment', 'Allowed without limit', 'Allowed only on weekends'], answer: 1 },
    { q: 'Financial records for a mining organisation should be kept safely for a minimum of:', options: ['6 months', '1 year', '5 years', '20 years'], answer: 2 },
    { q: 'What unlocked the government 10% development-fund loan for the Mama Safi women\'s group?', options: ['Political connections', 'Demonstrated financial discipline, transparency, and proper records with a business plan', 'A larger mining licence', 'Selling more gold'], answer: 1 },
    { q: 'Hearing protection (ear muffs/plugs) must be worn whenever:', options: ['You feel like it', 'You must raise your voice to be heard by a person 1 metre away', 'Only at night', 'Only during blasting'], answer: 1 },
  ],
});


COURSES.push({
  id: 'oil-palm',
  title: 'Oil Palm: Best Practice & Sustainable Production',
  subtitle: 'Best Management Practices for smallholder palm',
  category: 'Commodities',
  icon: commodityIcon(oilPalmIcon),
  duration: '1 hr 15 min',
  description: 'A seven-module summary of the Best Management Practices (BMP) for Oil Palm Production curriculum developed for smallholder farmers in East and Central Africa under the National Oil Palm Project. Built for Solidaridad ECA staff who support field teams, partner cooperatives, and farmer training in smallholder oil palm. Covers varieties and establishment, agronomy and the BMP field calendar, harvesting and fresh fruit bunch (FFB) quality, integrated pest and disease management, safe agrochemical use, and sustainability, agroforestry and carbon.',
  lessons: [
    {
      id: 'oil-palm-overview',
      title: 'Module 1 — Oil Palm & the BMP Approach',
      content: [
        { type: 'p', text: 'Oil palm (Elaeis guineensis) is a strategic perennial tree crop expanding across East and Central Africa to meet rising demand for vegetable oil. For smallholders it offers steady household income from a crop that can be grown on small family plots and in areas where other crops struggle. This course is a working summary of the Best Management Practices (BMP) for Oil Palm Production manual.' },
        { type: 'h', text: 'Why oil palm matters' },
        { type: 'list', items: [
          'High-value perennial cash crop — once established, it bears fresh fruit bunches (FFB) year-round for 25+ years',
          'Suits smallholders — productive on small family farms and on land less suited to annual crops',
          'Income and food security — supports household incomes and national edible-oil supply',
          'In Africa, smallholders produce about 80% of all FFB — they are the centre of the sector',
        ]},
        { type: 'h', text: 'The yield gap' },
        { type: 'stat', number: '10 t/ha/yr', label: 'Plantation FFB yield', detail: 'Well-managed estates using full best management practices' },
        { type: 'stat', number: '4 t/ha/yr', label: 'Smallholder average', detail: 'Held back by knowledge gaps, weak inputs, and finance constraints — not by the crop' },
        { type: 'callout', text: 'The gap between 4 and 10 t/ha is the entire opportunity. It is driven by practice gaps, not soil or climate limits. Closing it is what good extension support delivers.' },
        { type: 'h', text: 'What BMP actually means' },
        { type: 'p', text: 'In oil palm, BMP is defined as deploying every Yield-Making (Ym) and Yield-Taking (Yt) technique at the right time to reach optimum productivity while reducing the cost of production. Put simply: BMP = Ym + Yt. Done well, it both reduces cost and increases yield.' },
        { type: 'pathway', title: 'YIELD-MAKING (Ym)', text: 'Activities that build yield: pruning, fertiliser application, empty fruit bunch (EFB) application, leguminous cover cropping, palm circle and path upkeep, and good harvesting.' },
        { type: 'pathway', title: 'YIELD-TAKING (Yt)', text: 'Activities and failures that lose yield: poor slashing, woody-growth invasion, late or incomplete harvesting, loose-fruit losses, poor drainage, and neglected farm roads.' },
        { type: 'h', text: 'Constraints staff must work around' },
        { type: 'list', items: [
          'Inconsistent weather and a changing climate',
          'Difficulty accessing quality inputs (seedlings, fertiliser)',
          'Limited access to credit and advisory services',
          'Inefficient marketing and weak FFB price information',
          'Environmental and compliance pressure — RSPO principles and EU deforestation-free rules',
        ]},
        { type: 'callout', text: 'The EU deforestation regulation prohibits importing palm oil produced on land deforested after 2020. Establishment decisions made today carry compliance consequences for the whole supply chain.' },
        { type: 'highlight', text: 'Oil palm is a 25-year decision made in the first year. Get establishment and the BMP calendar right and income follows for a generation.' },
      ],
    },
    {
      id: 'oil-palm-varieties',
      title: 'Module 2 — Varieties, Nursery & Planting Material',
      content: [
        { type: 'p', text: 'Variety and planting-material choice is a once-per-cycle decision that locks in 25 years of performance. Get it wrong and no amount of field management can recover the lost oil. Three varieties of Elaeis guineensis are grown in the region — only one belongs in a commercial field.' },
        { type: 'h', text: 'The three varieties' },
        { type: 'value', title: 'TENERA', text: 'The only variety recommended for commercial planting. A Dura x Pisifera hybrid with a thick fleshy mesocarp, thin shell, and high oil-to-bunch ratio. Superior productivity and disease resistance, and a large number of fruit bunches. This is what should be in every smallholder field.' },
        { type: 'value', title: 'DURA', text: 'Thick shell, big kernel, thin mesocarp — about 30% less oil than Tenera. Valued for genetic diversity and resilience, used as a parent in breeding, but NOT for commercial planting because of low oil content.' },
        { type: 'value', title: 'PISIFERA', text: 'Thin shell, high oil content, but sterile (no fruit bunches) and lacks a protective shell, so it is vulnerable to pests. Used only as a parent plant in breeding. Never planted commercially.' },
        { type: 'callout', text: 'Volunteer oil palms (VOPs) — self-sown seedlings of unknown parentage — must never be used in a plantation because of their low and unpredictable productivity. Insist on certified Tenera seedlings from a reputable source.' },
        { type: 'h', text: 'Why Tenera wins' },
        { type: 'list', items: [
          'Each fruit produces a large quantity of oil, held in the yellow mesocarp flesh',
          'Palms carry a large number of fruit bunches',
          'Thin shell means a higher oil-to-bunch ratio than Dura',
          'Better disease resistance than the sterile, shell-less Pisifera',
        ]},
        { type: 'h', text: 'The nursery and establishment process' },
        { type: 'p', text: 'The oil palm journey runs: raise seedlings in the nursery, transplant young palms into the field, manage them through the immature phase, harvest ripe and mature FFB, and process the bunches at a mill into crude palm oil and by-products such as palm kernel shells. Each stage has its own BMPs — but nursery quality decides what enters the field.' },
        { type: 'h', text: 'Protecting seedlings in the nursery' },
        { type: 'list', items: [
          'Source only certified Tenera planting material — reject Dura, Pisifera, and volunteer palms',
          'Guard against rats, which attack seedlings in nurseries and cause severe retardation or death',
          'Cull weak, off-type, or diseased seedlings before they ever reach the field',
          'Acquire drought- and Ganoderma-resistant material (sourced from Cameroon and Benin) for new and replanting where basal stem rot is a risk',
        ]},
        { type: 'highlight', text: 'Only Tenera, only certified, never volunteers. The seedling decision is the cheapest decision in a 25-year cycle and the most expensive to get wrong.' },
      ],
    },
    {
      id: 'oil-palm-establishment',
      title: 'Module 3 — Site Selection, Lining & Establishment',
      content: [
        { type: 'p', text: 'Establishment is the starting point of the whole production cycle, and the planting layout fixes the plant population for 25 years. Site selection and lining are where staff add — or destroy — long-term yield potential before a single palm produces fruit.' },
        { type: 'h', text: 'Site selection' },
        { type: 'list', items: [
          'Evenly distributed annual rainfall of about 2,000 mm with no defined dry season',
          '1,800-2,000 sunlight hours a year; more than 300 cal/cm2 per day; at least 5 hours of constant sun daily',
          'Low-lying areas with flat or gentle slopes',
          'Well-drained soil with a topsoil profile at least 1.0 m deep (silty clay loam) for root development and moisture holding',
          'Soil pH between 4.0 and 6.8',
          'Avoid steep slopes above 25 degrees',
        ]},
        { type: 'callout', text: 'Avoid deforestation and never clear High Conservation Value (HCV) areas. Establishing on forest land breaches RSPO criteria and the EU deforestation-free regulation — it can lock the whole co-operative out of premium markets.' },
        { type: 'h', text: 'Lining and holing' },
        { type: 'p', text: 'Lining sets out where every palm will stand. Done well it maximises the plant population per hectare, gives each palm full access to light, water, and nutrients, and leaves room for harvesting, carrying bunches, and field operations for decades.' },
        { type: 'list', items: [
          'Begin lining 1-2 months after land preparation, before planting',
          'Run rows East-West so palms follow the direction of the sun and capture maximum light',
          'Keep alignment parallel — it makes carrying bunches to collection and weighing points far easier',
          'Use a triangular layout: distance between rows = 0.866 x distance between palms',
        ]},
        { type: 'h', text: 'Planting density by rainfall' },
        { type: 'stat', number: '143 palms/ha', label: 'High-rainfall areas', detail: 'Wider spacing — 9.0 m triangular (vertical distance 7.6 m on slope)' },
        { type: 'stat', number: '160 palms/ha', label: 'Low-rainfall areas', detail: 'Closer spacing — 8.5 m triangular (vertical distance 7.0 m on slope)' },
        { type: 'h', text: 'What new establishment costs' },
        { type: 'p', text: 'Establishing oil palm is a real upfront investment that staff should be able to discuss honestly with farmers and lenders. The reference budget for new development is about UGX 4.3 million per hectare (roughly USD 1,100), covering land clearing, lining and pegging, seedlings and transport, holing and planting, cover-crop seed and sowing, collaring against rats, and basal fertiliser.' },
        { type: 'highlight', text: 'Lining is permanent. A row planted crooked or too dense stays wrong for 25 years. Spend the time to line it right — East-West, parallel, and at the density the rainfall justifies.' },
      ],
    },
    {
      id: 'oil-palm-bmp-calendar',
      title: 'Module 4 — Ground Cover, Nutrition & the BMP Field Calendar',
      content: [
        { type: 'p', text: 'Once palms are in the ground, yield is built by a disciplined annual calendar of routine operations. Ground cover, pruning, and fertiliser are the core Yield-Making activities — each has a defined standard, interval, and number of rounds per year.' },
        { type: 'h', text: 'Leguminous cover crops (LCC)' },
        { type: 'p', text: 'A legume cover crop sown between the palm rows fixes nitrogen through Rhizobium root nodules, suppresses weeds, protects the soil, and conserves moisture. It is one of the highest-value early establishment practices.' },
        { type: 'list', items: [
          'Sow species such as Pueraria, Centrosema, Calopogonium, or Mucuna at about 7 kg of cover seed per hectare',
          'Mix cover seed with an equal amount of rock-phosphate (GRP) fertiliser before sowing',
          'Plant in drills or mounds 1.0 m apart, kept 2 m clear of the palm',
          'Sow after land preparation, at least a month before palm planting — or before the canopy closes in maturing fields',
        ]},
        { type: 'stat', number: '20-111 kg N/ha/yr', label: 'Nitrogen contributed by LCC', detail: 'Plus 2-9 kg P and 12-56 kg K per hectare per year from decomposed biomass' },
        { type: 'h', text: 'Pruning' },
        { type: 'p', text: 'Pruning removes dead and hanging fronds below the 9 o\'clock or 3 o\'clock position. Because palms photosynthesise through their leaves, the goal is to retain as much active green tissue as possible while keeping access for weeding, assisted pollination, and harvesting. Over-pruning starves the palm.' },
        { type: 'list', items: [
          'Two rounds a year — typically December/January and June/July',
          'Retain an average of about 40 fronds on the canopy of a mature palm',
          'On older, taller palms retain fewer fronds and fewer spirals; use a sickle rather than a chisel',
          'Use the box frond-stacking method: hard, thorny parts in the inter-row, soft parts across the palms',
        ]},
        { type: 'h', text: 'Empty fruit bunch (EFB) and frond recycling' },
        { type: 'list', items: [
          'Apply 30-40 tonnes of EFB per hectare (about 280 kg per palm) between palms, once every 5 years',
          'Arrange EFB in a single layer to aid aeration and avoid breeding Oryctes (rhinoceros) beetles',
          'Use pruned fronds as mulch to suppress weeds, conserve moisture, and arrest erosion',
        ]},
        { type: 'h', text: 'Fertiliser and the 4R principle' },
        { type: 'p', text: 'Fertiliser gives palms the nutrients for healthy growth and more bunches, and prevents nutrient mining over the long production cycle. The 4R Nutrient Stewardship principle guides every application.' },
        { type: 'value', title: 'RIGHT SOURCE', text: 'Balanced supply of essential nutrients in plant-available forms; for oil palm the least-costly source is usually straight fertilisers (e.g. TSP or DAP for phosphorus, kieserite for magnesium).' },
        { type: 'value', title: 'RIGHT RATE', text: 'Set by soil and leaf analysis. Leaf analysis is essential to assess palm nutrient status and estimate requirements. Smallholder NPK (20-10-10) rates rise from about 1 kg to 4 kg per palm per year through the immature phase.' },
        { type: 'value', title: 'RIGHT TIME', text: 'Apply nitrogen only when there is a strong likelihood of more than 20 mm rain within four days. Split into 2-4 applications, typically April-October. Avoid very heavy rain and very dry periods.' },
        { type: 'value', title: 'RIGHT PLACE', text: 'Ring application in immature palms (0-6 years); inter-row in mature palms (7+). Apply nitrogen over clean, weeded circles free of debris. Use the flick method for even spread.' },
        { type: 'h', text: 'The standard field activity calendar' },
        { type: 'list', items: [
          'Slashing — 2-3 rounds/year, every 4-6 months, weed height kept below ankle level',
          'Palm circles — 4 rounds/year, every 3 months, kept clean to a 1.5-2 m radius; rake after pruning',
          'Field paths — 4 rounds/year, every 3 months, 1.0 m wide and stump-free',
          'Pruning — 2 rounds/year, average 40 fronds retained',
          'Fertiliser — 2-4 splits, April-October, flick method, follow 4R',
          'Harvesting — about 25 rounds/year, every 10-14 days',
        ]},
        { type: 'highlight', text: 'Oil palm yield is not made on one big day — it is made by 40-odd routine rounds a year, each done to standard. The calendar IS the agronomy.' },
      ],
    },
    {
      id: 'oil-palm-harvest',
      title: 'Module 5 — Harvesting & FFB Quality',
      content: [
        { type: 'p', text: 'Harvesting is where months of field work convert into oil — or are wasted. The Oil Extraction Rate (OER) is decided in the field, not at the mill. Harvest the wrong bunches, at the wrong ripeness, and the oil simply is not there to extract.' },
        { type: 'h', text: 'Ripeness is judged by loose fruit, not colour' },
        { type: 'p', text: 'The single most important rule a harvester must learn: bunch ripeness is determined by the number of detached (loose) fruits, NOT by colour. Colour misleads; loose-fruit count does not.' },
        { type: 'value', title: 'UNRIPE', text: 'No single detached or loose fruit. Unacceptable — low oil extraction rate. Do not cut.' },
        { type: 'value', title: 'UNDER-RIPE', text: '1-5 detached or loose fruits. Still unacceptable — oil extraction rate is too low. Do not cut.' },
        { type: 'value', title: 'RIPE', text: 'More than 5 loose fruits. Acceptable — excellent OER. This is the target.' },
        { type: 'value', title: 'OVER-RIPE', text: 'More than a quarter of the bunch as loose fruits. Acceptable, but the loose fruits must all be collected to capture the oil.' },
        { type: 'value', title: 'ROTTEN', text: 'Almost empty bunch or watery EFB. Unacceptable — high free fatty acids (FFA) ruin oil quality. Collect only the loose fruit.' },
        { type: 'callout', text: 'Cutting under-ripe bunches to hit a quota destroys OER for the whole load; leaving ripe bunches lets them rot and spike FFA. Strict compliance with the ripeness standard is non-negotiable.' },
        { type: 'h', text: 'Harvest rounds and timing' },
        { type: 'p', text: 'Fruit bunches are produced all year with a distinct peak and trough. Harvesting is therefore a continuous, year-round activity at intervals of 10-14 days.' },
        { type: 'list', items: [
          'Harvesting at 7-day intervals or shorter is usually uneconomic, especially in the trough',
          'Intervals beyond 15 days produce excessive loose fruit and higher collection labour, and missed ripe bunches rot',
          '10-day intervals are recommended, extending to 15 days during peak season',
          'Cut the bunch stalk short — a V-shape less than 2.0 cm long',
          'Remove dead and damaged fronds before harvesting, and always collect every loose fruit on the ground',
        ]},
        { type: 'h', text: 'Matching tool to palm height' },
        { type: 'list', items: [
          'Young palms (5-7 years): a chisel with a 10 cm edge, removing dead/damaged fronds before harvesting',
          'Medium palms (8-15 years): chisel or sickle',
          'Tall palms (over 15 years): a sickle on a pole, with minimal frond removal',
        ]},
        { type: 'highlight', text: 'Count the loose fruit, not the colour. The Oil Extraction Rate is won or lost at the moment the harvester decides to cut.' },
      ],
    },
    {
      id: 'oil-palm-ipdm',
      title: 'Module 6 — Integrated Pest & Disease Management',
      content: [
        { type: 'p', text: 'Pests and diseases can quietly erode a stand for years before symptoms are obvious. Integrated Pest and Disease Management (IPDM) keeps pest populations below the level that causes economic injury, using cultural, biological, mechanical, and — only when justified — chemical controls. The key success factor is early detection through regular census, and rapid response.' },
        { type: 'h', text: 'The IPDM decision steps' },
        { type: 'list', items: [
          'Identify the pest species correctly',
          'Estimate the population and compare it to established action thresholds',
          'Select the appropriate control tactic based on current field information',
          'Assess whether the control worked',
          'Keep proper records',
        ]},
        { type: 'h', text: 'Major pests' },
        { type: 'pathway', title: 'TERMITES (Coptotermes)', text: 'Most termites are beneficial decomposers, but Coptotermes curvignathus attacks palms as early as 7-8 months after planting. Untreated, immature infestations reach 8-9%, killing 3-5% of palms a year; on mature areas over 50% of palms can die by age 10. Control: monitor for mounds, targeted ant-killer products, and poultry as biological control.' },
        { type: 'pathway', title: 'LEAF-EATING CATERPILLARS', text: 'Nettle caterpillars and bagworms defoliate palms of all ages, worst on mature palms over 5 years where overlapping fronds spread them palm to palm. Control: conserve natural enemies (predatory wasps, parasitoids, fungal/viral pathogens), plant Cassia cobanensis, and use cypermethrin products only when thresholds are crossed.' },
        { type: 'pathway', title: 'RHINOCEROS BEETLE (Oryctes)', text: 'A serious pest of immature palms; grubs breed in rotting woody material and snap young fronds. Control: aggregating pheromone traps, removing breeding sites, and integrating chemical spraying as part of IPM monitoring. This is exactly why EFB must be laid in a single aerated layer.' },
        { type: 'pathway', title: 'RODENTS (Rattus)', text: 'Rats feed on loose fruit, developing bunches, and inflorescences, and chew immature palm bases and nursery seedlings to death. Control: regular block-by-block census with prompt baiting, traps, and barn owls (Tyto alba) as biological control.' },
        { type: 'h', text: 'Major diseases' },
        { type: 'pathway', title: 'BASAL STEM ROT (Ganoderma)', text: 'The only major disease of oil palm, caused by a soil-borne fungus with no effective chemical cure. Earliest sign is an excess of unopened spear leaves (healthy palms have 1-3); pale foliage; dead fronds forming a skirt; bracket-shaped sporophores. Manage by monitoring and cultural control — trenching around sick palms, felling and confining dead palms, and using resistant planting material. Golden rule: NEVER poison a Ganoderma-infected palm.' },
        { type: 'pathway', title: 'FUSARIUM WILT', text: 'A lethal, highly infectious fungal disease (Fusarium oxysporum) with no effective treatment. Signature symptom is one-sided death of pinnae (leaflets) along a frond with dark rachis colouration. Palms can be infected for months or years before symptoms show, acting as silent sources. Spread mainly on pruning tools. Use wilt-resistant planting material.' },
        { type: 'callout', text: 'Both major diseases spread on contaminated tools. When pruning or harvesting where disease is present, use multiple tools and sterilise blades between palms by soaking in bleach (JIK) for at least 10 minutes. Prune Ganoderma areas only in still air — sawdust carries inoculum.' },
        { type: 'highlight', text: 'Early detection beats every cure. There is no chemical fix for Ganoderma or Fusarium — regular census, clean tools, and resistant material are the whole defence.' },
      ],
    },
    {
      id: 'oil-palm-sustainability',
      title: 'Module 7 — Safe Agrochemicals, Sustainability & Carbon',
      content: [
        { type: 'p', text: 'Oil palm carries real environmental scrutiny — over deforestation, peatland, and chemical use. Staff must be able to support safe agrochemical handling, sustainable land management, and the emerging opportunities in agroforestry and carbon, all of which protect both farmers and market access.' },
        { type: 'h', text: 'Safe use of agrochemicals' },
        { type: 'p', text: 'Herbicides (e.g. glyphosate) and pesticides (e.g. cypermethrin) are used in oil palm but are harmful if mishandled. Always read the label and Material Safety Data Sheet (MSDS), follow MAAIF and label instructions, and respect the colour-coded toxicity bands: red (extremely toxic), blue (highly toxic), yellow (moderately toxic), green (slightly toxic).' },
        { type: 'list', items: [
          'No handling without the five PPE items — gloves, mask/respirator, overalls, boots, eye protection',
          'Use separate tanks for herbicides and pesticides; never blow blocked nozzles with your mouth',
          'Stand upwind when filling or spraying; never eat, drink, or smoke; wash hands after spraying',
          'Store agrochemicals in a separate, locked, ventilated building, never uphill from a water source, always in original labelled containers',
          'Observe the withholding period after spraying (usually 24 hours, over a week for very toxic products) and never harvest before the pre-harvest interval',
        ]},
        { type: 'callout', text: 'If someone is exposed: move them to fresh air, remove contaminated clothing, wash skin or eyes with water, do NOT induce vomiting, and take them to the clinic with the product label or container.' },
        { type: 'h', text: 'Sustainable land and water management' },
        { type: 'list', items: [
          'Water management — flood-protection bunds, and V-profile bucket drains (self-cleaning, less prone to collapse) every four palm rows; desilt every 6 months',
          'Soil conservation — platforms and contour terraces on slopes of 7-9 degrees; EFB (40 t/ha) on degraded soils; frond stacking to arrest erosion',
          'Mulching — dry fronds to suppress weeds and conserve moisture',
          'Weed management — slashing, uprooting, and spot herbicide on noxious weeds such as Imperata cylindrica (speargrass), Chromolaena odorata (Siam weed), Mimosa, and woody shrubs',
        ]},
        { type: 'h', text: 'Agroforestry — diversifying the oil palm landscape' },
        { type: 'p', text: 'Mixed, diversified oil palm systems can raise resource-use efficiency, reduce farmer risk, and cut greenhouse-gas emissions per unit of product. Agroforestry combines trees, crops, and sometimes livestock for synergy.' },
        { type: 'value', title: 'AGRISILVICULTURAL', text: 'Trees with crops — alley cropping, mixed tree gardens, fruit/nut orchards, boundary planting, and intercropping shade-tolerant crops.' },
        { type: 'value', title: 'SILVOPASTORAL', text: 'Trees with pasture and livestock — tree/shrub plantations on grazing land, fodder banks, and boundary planting.' },
        { type: 'value', title: 'AGROSILVOPASTORAL', text: 'Trees, crops, and livestock together — woody hedgerows, home gardens, and boundary planting between pasture and cropland.' },
        { type: 'value', title: 'CONSERVATION BUFFERS', text: 'Riparian and conservation buffers protect water bodies; tree islands enrich monoculture without cutting yield; secondary forest is encouraged on agricultural land.' },
        { type: 'h', text: 'Carbon, biochar and markets' },
        { type: 'list', items: [
          'Regenerative practices can be monetised through carbon markets such as Rabobank\'s Acorn programme',
          'Biochar — made by pyrolysing oil palm residues (fronds, FFB waste, dead trees) in a low-oxygen cone pit — stores carbon and improves soil',
          'One tonne of biochar locks up roughly three tonnes of CO2 in stable carbon',
          'Biochar improved plant nitrogen absorption by about 12% more than urea in a 2020 study, and boosts water retention on sandy soils',
        ]},
        { type: 'callout', text: 'Sustainability is not a side-show for oil palm — it is market access. RSPO compliance and deforestation-free production are increasingly the price of entry to buyers and finance.' },
        { type: 'highlight', text: 'Productive smallholder oil palm and forest protection can coexist — through agroforestry, clean agrochemical use, and good land management. That coexistence is what keeps the market open.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Oil Palm Field Scenarios',
    scenarios: [
      {
        situation: 'A farmer wants to cut establishment costs by planting volunteer oil palm seedlings (VOPs) that have sprouted naturally near an old palm, plus a few cheap Dura seedlings a trader is selling. He asks for your blessing.',
        options: [
          { text: 'Approve it — seedlings are seedlings, and the cost saving is real for a smallholder.', correct: false, feedback: 'This is a 25-year mistake. VOPs have unknown, low productivity and Dura produces about 30% less oil than Tenera. The cheap seedling is the most expensive decision he will make.' },
          { text: 'Insist on certified Tenera seedlings only. Explain that VOPs and Dura lock in low yield for the whole 25-year cycle, and that Tenera\'s high oil-to-bunch ratio is what makes the field worth the establishment cost. Connect him to a reputable certified-seedling source.', correct: true, feedback: 'Correct. Only Tenera belongs in a commercial field. VOPs are unpredictable and Dura is a breeding parent, not a producer. The seedling is the cheapest input and the most consequential.' },
          { text: 'Compromise — let him plant VOPs on half the field and Tenera on the other half.', correct: false, feedback: 'Half a field of low-yielding palms still wastes 25 years of land, labour, and fertiliser on that half. There is no good case for planting anything but certified Tenera.' },
        ],
      },
      {
        situation: 'A co-operative plans to clear a patch of natural forest on a gentle slope to expand its oil palm. The soil there is excellent and members are keen. They ask you to help line it out.',
        options: [
          { text: 'Help line it out — the agronomy is sound: good soil, gentle slope, fits the spacing rules.', correct: false, feedback: 'The agronomy is irrelevant if the land breaches the rules. Clearing forest after 2020 makes the palm oil ineligible under the EU deforestation regulation and breaches RSPO — risking market access for the whole co-operative.' },
          { text: 'Stop the plan. Explain that clearing forest or HCV areas breaches RSPO criteria and the EU deforestation-free regulation (no land deforested after 2020), which can lock the co-operative out of premium buyers. Help them find already-degraded or non-forest land instead.', correct: true, feedback: 'Correct. Avoiding deforestation and HCV areas is a hard rule, not a preference. Site selection must satisfy compliance first, then agronomy. Redirect to suitable non-forest land.' },
          { text: 'Suggest they clear it quietly and not record it, since the soil is so good.', correct: false, feedback: 'Concealment compounds the breach and destroys traceability. Deforestation-free supply chains depend on honest records — this would put the entire programme\'s certification at risk.' },
        ],
      },
      {
        situation: 'During a harvest visit you find a new harvester cutting bright orange-red bunches that have no loose fruit on the ground yet, and leaving duller bunches that are shedding several loose fruits. He says he goes by colour.',
        options: [
          { text: 'Praise him — bright orange bunches are clearly the ripest and best.', correct: false, feedback: 'Colour misleads. A bunch with no loose fruit is unripe regardless of colour, and cutting it gives a low Oil Extraction Rate. The bunches he is leaving are the ripe ones.' },
          { text: 'Retrain on the loose-fruit standard: ripeness is judged by detached fruit, not colour. More than 5 loose fruits means ripe and acceptable; zero loose fruit means unripe and unacceptable. He should cut the shedding bunches and leave the others until they loosen.', correct: true, feedback: 'Correct. Bunch ripeness is determined by the number of detached fruits, not colour. The OER is decided in the field — cutting unripe bunches and leaving ripe ones to rot wastes oil both ways.' },
          { text: 'Tell him to cut everything so nothing is missed.', correct: false, feedback: 'Cutting unripe bunches drags down the Oil Extraction Rate for the whole load, and over-ripe missed bunches spike free fatty acids. Selectivity by loose-fruit count is the whole point.' },
        ],
      },
      {
        situation: 'A farmer reports several palms with an unusual number of unopened spear leaves and pale foliage, and you spot a bracket-shaped fungal growth at the base of one trunk. He wants to inject the palms with a strong fungicide to save them.',
        options: [
          { text: 'Help him source a systemic fungicide and treat all affected palms.', correct: false, feedback: 'This looks like basal stem rot (Ganoderma), for which there is no effective chemical cure. The golden rule is: never poison a Ganoderma-infected palm. Chemical injection wastes money and does not work.' },
          { text: 'Identify it as likely Ganoderma basal stem rot. Apply cultural control: trench around sick palms to cut their roots off from healthy ones, fell and confine dead palms, and plan replanting with resistant material. Sterilise any tools in bleach for 10 minutes between palms.', correct: true, feedback: 'Correct. Ganoderma is soil-borne with no chemical cure — management is monitoring, trenching, felling and confinement, and resistant planting material. Never poison an infected palm.' },
          { text: 'Tell him to do nothing — it will resolve on its own.', correct: false, feedback: 'Doing nothing lets the soil-borne fungus spread to neighbouring palms through root contact. Active cultural control (trenching, felling) is needed to contain it.' },
        ],
      },
      {
        situation: 'A field officer is about to top-dress nitrogen fertiliser across a block. It is the middle of a long dry spell, the palm circles are full of weeds and shed petiole debris, and he plans to broadcast it loosely by hand to save time.',
        options: [
          { text: 'Go ahead — getting fertiliser out now is better than waiting.', correct: false, feedback: 'This breaks three of the 4Rs. Nitrogen applied in a dry spell, onto weedy debris-filled circles, broadcast unevenly, will largely be lost. Money down the drain.' },
          { text: 'Hold off and apply the 4R principle: wait for a period with a strong chance of more than 20 mm rain within four days, clean and weed the palm circles first, then apply evenly using the flick method in splits.', correct: true, feedback: 'Correct. Right time means applying nitrogen only when rain is likely within four days; right place means clean, weeded, debris-free circles; the flick method gives even spread. The 4Rs prevent nutrient loss and mining.' },
          { text: 'Apply double the rate now to make up for the dry conditions.', correct: false, feedback: 'A higher rate in the wrong conditions just loses more nitrogen and wastes more money. The fix is right time and right place, not a bigger dose.' },
        ],
      },
      {
        situation: 'A young plantation has empty fruit bunches (EFB) arriving from the mill. A worker dumps them in thick heaps near the palms to clear the truck quickly. A week later you notice rhinoceros beetle grubs in the rotting heaps.',
        options: [
          { text: 'Leave the heaps — EFB is good organic matter and the beetles are harmless.', correct: false, feedback: 'Thick rotting heaps are exactly where Oryctes rhinoceros beetles breed, and their grubs snap the fronds of immature palms. The application method is wrong, even though EFB itself is valuable.' },
          { text: 'Spread the EFB into a single aerated layer between palms (about 30-40 t/ha, ~280 kg/palm, every 5 years) so it does not breed beetles, and monitor with pheromone traps. EFB replenishes nitrogen and potassium when applied correctly.', correct: true, feedback: 'Correct. EFB is a strong nutrient source, but it must go down in a single layer to aid aeration and avoid breeding Oryctes. Pair with pheromone-trap monitoring for the beetles.' },
          { text: 'Stop using EFB altogether to avoid the beetle risk.', correct: false, feedback: 'Abandoning EFB throws away a major source of nitrogen and potassium and a soil-conservation tool. The answer is correct application (single aerated layer), not avoidance.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'The only oil palm variety recommended for commercial planting is:', options: ['Dura', 'Pisifera', 'Tenera', 'Volunteer oil palms (VOPs)'], answer: 2 },
    { q: 'In Africa, smallholders produce approximately what share of all fresh fruit bunches (FFB)?', options: ['20%', '50%', '80%', '95%'], answer: 2 },
    { q: 'A typical well-managed smallholder oil palm yield, against a plantation potential of about 10 t/ha/yr, is around:', options: ['1 t/ha/yr', '4 t/ha/yr', '8 t/ha/yr', '12 t/ha/yr'], answer: 1 },
    { q: 'The BMP shorthand "BMP = Ym + Yt" stands for:', options: ['Yield Money plus Yield Time', 'Yield-Making plus Yield-Taking techniques', 'Young Material plus Yield Target', 'Yearly Maintenance plus Yearly Treatment'], answer: 1 },
    { q: 'Oil palm requires an evenly distributed annual rainfall of about:', options: ['500 mm', '1,000 mm', '2,000 mm', '4,000 mm'], answer: 2 },
    { q: 'Establishment lining should avoid steep slopes above:', options: ['5 degrees', '10 degrees', '25 degrees', '45 degrees'], answer: 2 },
    { q: 'Recommended planting density is higher (160 palms/ha) in:', options: ['High-rainfall areas', 'Low-rainfall areas', 'Steep areas', 'Peat soils'], answer: 1 },
    { q: 'Pruning removes dead and hanging fronds that hang below which position?', options: ['12 o\'clock', 'The 9 o\'clock or 3 o\'clock position', '6 o\'clock only', 'Any position with green tissue'], answer: 1 },
    { q: 'Bunch ripeness for harvesting is determined by:', options: ['The colour of the bunch', 'The number of detached (loose) fruits', 'The weight of the bunch', 'The age of the palm'], answer: 1 },
    { q: 'A bunch is classed as RIPE and acceptable when it has:', options: ['No loose fruit', '1-5 loose fruits', 'More than 5 loose fruits', 'A watery empty bunch'], answer: 2 },
    { q: 'The recommended harvesting interval is:', options: ['Every 1-2 days', 'Every 10-14 days', 'Once a month', 'Once a season'], answer: 1 },
    { q: 'The golden rule for a palm infected with Ganoderma (basal stem rot) is:', options: ['Inject it with strong fungicide', 'Never poison a Ganoderma-infected palm', 'Harvest it heavily before it dies', 'Leave it and do nothing'], answer: 1 },
    { q: 'Empty fruit bunches (EFB) should be spread in a single aerated layer mainly to:', options: ['Look tidy', 'Avoid breeding Oryctes (rhinoceros) beetles', 'Speed up the truck', 'Increase the bunch colour'], answer: 1 },
    { q: 'Under the 4R principle, nitrogen fertiliser should be applied when there is a strong chance of:', options: ['A dry spell of at least four days', 'More than 20 mm of rain within four days', 'Full sun all week', 'Frost overnight'], answer: 1 },
    { q: 'A key sustainability rule for site selection that also protects market access is:', options: ['Plant only on cleared forest land', 'Avoid deforestation and High Conservation Value (HCV) areas', 'Always use the steepest slopes', 'Drain all wetlands first'], answer: 1 },
  ],
});


COURSES.push({
  id: 'cocoa',
  title: 'Cocoa: Farming, Climate & Farmer Empowerment',
  subtitle: 'Solidaridad ECA\'s sustainable cocoa programme in Bundibugyo',
  category: 'Commodities',
  icon: commodityIcon(cocoaIcon),
  duration: '1 hr 15 min',
  description: 'A seven-module working summary of Solidaridad Eastern and Central Africa\'s cocoa programme, built on the ICAM-funded "Sustainable Farming for a Climate-Resilient Livelihood of Cocoa Farmers in Bundibugyo District, Uganda" project. Covers the cocoa value chain, agroforestry and good agricultural practice, the farm-level greenhouse-gas footprint, and the farmer-empowerment pillars Solidaridad pairs with agronomy: VSLA, the Gender Action Learning System (GALS), and EA$E business and financial skills. Designed for staff who support field teams, gender champions, and partner cooperatives.',
  lessons: [
    {
      id: 'cocoa-overview',
      title: 'Module 1 — Cocoa & Solidaridad\'s ECA Cocoa Work',
      content: [
        { type: 'p', text: 'Cocoa is a Solidaridad Eastern and Central Africa (ECA) commodity grown by smallholders in western Uganda and Tanzania. This course is a working summary of the "Sustainable Farming for a Climate-Resilient Livelihood of Cocoa Farmers in Uganda" project (2024-2026), implemented in Bundibugyo District by ICAM, Sano Rice, and Solidaridad ECA, and funded by the Netherlands Enterprise Agency through the Fund for Responsible Business (FVO).' },
        { type: 'h', text: 'Why cocoa matters in ECA' },
        { type: 'list', items: [
          'Primary cash crop and main income source for most farming households in Bundibugyo',
          'Highland cocoa from the "Pearl of Africa" is a prized origin fermented and dried locally',
          'Globally, around 15 million smallholders on plots under 2.5 ha produce over 90% of the world\'s cocoa — yet most growers live in poverty, earning only 6-8% of the final product\'s value',
          'Cocoa suits agroforestry — it can be grown with banana, coconut, fruit and timber trees that add income and food security',
          'A high-value crop facing historic price volatility — London exchange prices rose roughly 70% across 2023 alone',
        ]},
        { type: 'h', text: 'The ESG risks the project tackles' },
        { type: 'p', text: 'ICAM\'s 2020 and 2023 impact assessments mapped the environmental, social, and governance (ESG) risks in Uganda\'s cocoa value chain. The project is designed around them.' },
        { type: 'list', items: [
          'Deforestation and biodiversity loss',
          'A living income gap of around 52%, driven by low yields',
          'Poor farmer skills and weak farmer organisation',
          'Land degradation — soil infertility and erosion from a lack of soil-conservation knowledge',
          'Child labour, corruption, gender inequality, and food insecurity',
        ]},
        { type: 'h', text: 'The project at a glance' },
        { type: 'stat', number: '600', label: 'Target cocoa farmers in Bundibugyo', detail: 'Including women and youth, across Sindila, Ndughuto and Kaghugu sub-counties' },
        { type: 'stat', number: '672 to 841 kg/ha', label: 'Yield target', detail: 'Lifting average cocoa yield from 672.94 kg/ha to 841.18 kg/ha over the project' },
        { type: 'stat', number: 'EUR 540 to 649', label: 'Income target', detail: 'Raising farmer income from EUR 540.54 to EUR 648.65, alongside sustainable management of 310 hectares' },
        { type: 'h', text: 'The four project pathways' },
        { type: 'pathway', title: 'CSR DUE DILIGENCE', text: 'Corporate due-diligence so partner policies address ESG risks, including full supply-chain traceability ahead of the EU Deforestation Regulation (EUDR).' },
        { type: 'pathway', title: 'GALS', text: 'The Gender Action Learning System promotes gender equality and joint household decision-making — Module 5.' },
        { type: 'pathway', title: 'VSLA', text: 'Village Savings and Loan Associations build financial empowerment and access to credit — Module 6.' },
        { type: 'pathway', title: 'AGROFORESTRY (PIP)', text: 'Sustainable land management under the Participatory Integrated Planning (PIP) methodology, diversifying the cocoa agroecosystem — Module 2.' },
        { type: 'callout', text: 'Cocoa agronomy alone does not close a living-income gap. Solidaridad\'s model pairs Good Agricultural Practice with social empowerment — GALS, VSLA, and EA$E business skills — because income, gender equity, and resilience reinforce one another.' },
        { type: 'h', text: 'The result so far' },
        { type: 'p', text: 'The 2025 household income survey of 169 farmers recorded average household cocoa income rising from 3,044,057 UGX in 2023 (Project A) to 13,014,896 UGX in 2025 — surpassing the local living-income benchmark of about UGX 5,160,000 (EUR 1,395) per year. Average production per household rose 47%, from 472 kg to 694 kg in a single period. Farmers attribute the gains to GAP plus the social interventions, though buoyant world cocoa prices are also a factor that further analysis must separate out.' },
        { type: 'highlight', text: 'Cocoa is a high-leverage ECA commodity. Get the agronomy and the household economics right together, and income, resilience, and a low-carbon footprint follow.' },
      ],
    },
    {
      id: 'cocoa-agronomy',
      title: 'Module 2 — Agroforestry & Good Agricultural Practice',
      content: [
        { type: 'p', text: 'In Africa, the main causes of low cocoa profitability are low yields, high pest and disease pressure, ageing plantations, and depleted soils. Good Agricultural Practice (GAP) within a diversified agroforestry system is how the project closes the yield gap without clearing more forest.' },
        { type: 'h', text: 'Core GAP for cocoa' },
        { type: 'list', items: [
          'Pruning — opens the canopy, improves airflow, and reduces pest and disease pressure',
          'Correct spacing and weeding — the practices farmers most often credit for higher yields',
          'Fertilisation guided by soil need, plus mulching to retain moisture and build organic matter',
          'Renewal of older, declining trees — replanting and rehabilitating ageing plantations',
          'Pest and disease control, especially given the advanced age of many plots',
          'Clonal nurseries and budwood gardens to supply improved, productive planting material',
        ]},
        { type: 'callout', text: 'Keeping existing plantations productive is itself an anti-deforestation measure. When a plot stops yielding, the temptation is to clear new forest land — GAP that preserves productivity removes that pressure.' },
        { type: 'h', text: 'Why agroforestry suits cocoa' },
        { type: 'p', text: 'Cocoa grows naturally under shade and pairs well with banana, coconut, fruit, and timber trees. Integrating food crops, fruit trees, and forest trees into cocoa plots — an agroforestry system built under the PIP methodology — delivers benefits a monocrop cannot.' },
        { type: 'value', title: 'EXTRA INCOME', text: 'Supplementary crops provide additional income streams with different seasonality, so households earn outside the cocoa harvest window.' },
        { type: 'value', title: 'FOOD SECURITY', text: 'Food and fruit crops on the same plot strengthen household nutrition — important where the June-August lean season drives food insufficiency.' },
        { type: 'value', title: 'CLIMATE & BIODIVERSITY', text: 'Shade and tree cover counter climate stress, protect biodiversity, and build the soil carbon stock that makes cocoa farms a carbon sink (Module 4).' },
        { type: 'value', title: 'RESILIENCE', text: 'Diversified income reduces a household\'s exposure to a single crop\'s price swings and a single season\'s weather.' },
        { type: 'h', text: 'Carbon-stock practices recorded on the farm' },
        { type: 'list', items: [
          'Intercrops — avocado, cashew, jackfruit, rubber and similar, recorded by share of growing area and density',
          'Shade trees — type, share of growing area, and planting density',
          'Hedges — by width and length, marking field boundaries and biodiversity corridors',
        ]},
        { type: 'h', text: 'Soil and land management' },
        { type: 'p', text: 'Climate change and cocoa yields are linked through the soil. Erosion and loss of fertility are made worse by a lack of agronomic soil-conservation knowledge. The project promotes minimal tillage, organic mulching, composting, and cover cropping to hold soil, retain moisture, and build organic carbon.' },
        { type: 'h', text: 'The buyer connection' },
        { type: 'p', text: 'ICAM Chocolate Uganda runs fermentation and drying centres in Bundibugyo (since 2010), Hoima (2011), and Mukono (2013), and has trained 6,899 farmers across the three sites. GAP feeds directly into certification: ICAM purchases certified organic or Rainforest Alliance cocoa, so pruning, spacing, and clean processing are also the route to premium markets.' },
        { type: 'highlight', text: 'Agroforestry is the design; GAP is the discipline. Together they raise yield per hectare, diversify income, and keep the forest standing.' },
      ],
    },
    {
      id: 'cocoa-postharvest',
      title: 'Module 3 — Harvest, Fermentation & Quality',
      content: [
        { type: 'p', text: 'Cocoa\'s value is made or lost after the pod is cut. Fermentation and drying develop the flavour the market pays for — and poor on-farm handling can wipe out up to 30% of the harvest. In Bundibugyo, farmers traditionally ferment and dry beans at home, exposing the crop to theft and weather damage.' },
        { type: 'h', text: 'Why post-harvest handling decides price' },
        { type: 'list', items: [
          'Fermentation develops the chocolate flavour precursors buyers grade and pay for',
          'Proper drying brings beans to a safe moisture level, preventing mould in storage',
          'Theft and adverse weather during home processing can cost up to 30% of the harvest',
          'Poor quality means a minimal selling price — a direct hit to household income',
          'Careless, inadequate processing is a leading cause of avoidable crop loss',
        ]},
        { type: 'callout', text: 'A farmer can do everything right in the field and still earn a low price if fermentation and drying are mishandled. Post-harvest quality is where agronomy converts into income.' },
        { type: 'h', text: 'The centralised processing model' },
        { type: 'p', text: 'ICAM\'s response was to build cocoa collection and first-stage processing centres rather than leave every step to individual homesteads. The model reduces loss and standardises quality.' },
        { type: 'pathway', title: 'CENTRAL FERMENTATION & DRYING', text: 'Beans are fermented and dried at the Bundibugyo, Hoima, and Mukono centres following ICAM procedures and know-how, with strict quality control before shipment.' },
        { type: 'pathway', title: 'CONSISTENT QUALITY', text: 'Centralised processing produced an especially prized highland cocoa — improving sensory quality, grade, and the price the origin commands.' },
        { type: 'h', text: 'What staff should reinforce in the field' },
        { type: 'list', items: [
          'Harvest only ripe pods and break them promptly to start fermentation cleanly',
          'Use the collection and fermentation centres where available rather than improvising at home',
          'Keep beans off bare ground; dry on raised surfaces and protect from rain',
          'Never mix wet and dry, or fermented and unfermented, beans',
          'Treat secure storage and prompt delivery as part of quality, not an afterthought',
        ]},
        { type: 'h', text: 'Quality and certification' },
        { type: 'p', text: 'Quality handling is also the gateway to certification premiums. ICAM\'s direct purchases of certified organic and Rainforest Alliance cocoa, and Fairtrade purchasing elsewhere in its chain, all depend on traceable, well-processed beans. For Bundibugyo, good fermentation is what turns a sustainability story into a price.' },
        { type: 'highlight', text: 'Up to 30% of the harvest can be lost between pod and sale. Capturing that loss through better fermentation, drying, and storage is the cheapest income gain on the cocoa farm.' },
      ],
    },
    {
      id: 'cocoa-climate',
      title: 'Module 4 — The Cocoa Carbon Footprint & Climate-Smart Practice',
      content: [
        { type: 'p', text: 'In 2025 Solidaridad ran a Scope 3 greenhouse-gas (GHG) baseline for the Bundibugyo cocoa supply chain — surveying 235 households with Kobo Collect and computing emissions on the Cool Farm Platform. The findings reshape what "climate-smart" means for these farms.' },
        { type: 'h', text: 'The headline numbers' },
        { type: 'stat', number: '0.71 tCO2e/ha', label: 'Carbon footprint per hectare', detail: 'A relatively low footprint, consistent with low-input, largely organic cocoa systems' },
        { type: 'stat', number: '1.01 kg CO2e/kg', label: 'Per kilogram of cocoa beans', detail: 'A clear carbon-intensity metric for the origin and a baseline to track against' },
        { type: 'stat', number: '-0.82 tCO2e', label: 'Net soil carbon change', detail: 'A carbon sink — well-managed cocoa soils may sequester more carbon than the farm emits' },
        { type: 'h', text: 'Where the emissions come from' },
        { type: 'p', text: 'The result is unusual and important: emissions are overwhelmingly about how crop residues are handled, not fertiliser, fuel, or land clearing.' },
        { type: 'list', items: [
          'Crop residues — about 98.7% of emissions, from burning and uncontrolled decomposition of pruned material and pod husks',
          'Fertiliser — about 0.91%, chiefly nitrous oxide (N2O) released after application',
          'Transport — about 0.37%, from moving inputs and produce along the value chain',
          'Deforestation and fossil-fuel energy — effectively zero, reflecting sustainable land use and low fuel reliance',
          'Soil carbon — a net negative (a sink) of about -0.82 tCO2e',
        ]},
        { type: 'callout', text: 'The single biggest lever in Bundibugyo is not fertiliser or fuel — it is crop-residue management. Stop the burning and uncontrolled rotting of prunings and husks, and you address almost the entire footprint.' },
        { type: 'h', text: 'The three residue interventions' },
        { type: 'value', title: 'BIOCHAR', text: 'Convert residues to biochar by pyrolysis (burning in low oxygen) instead of open burning. Cuts emissions and improves soil structure, water retention, and nutrient availability. Small-scale kilns make it practical for smallholders.' },
        { type: 'value', title: 'COMPOSTING', text: 'Compost pod husks and pruned material instead of letting them rot or burning them. Stabilises organic matter, reduces methane, and returns nutrients. Needs training on pit construction, turning, and carbon-nitrogen ratios.' },
        { type: 'value', title: 'MULCHING / COVER CROPS', text: 'Use pruned material as mulch, or pair with legume cover crops. Reduces erosion, retains moisture, suppresses weeds, cuts fertiliser need, and builds soil organic carbon.' },
        { type: 'h', text: 'The wider climate-smart agenda' },
        { type: 'list', items: [
          'Enhance the soil carbon sink through agroforestry, minimal tillage, and intercropping',
          'Optimise fertiliser via integrated soil fertility management — right timing, right rate, organic sources — to cut N2O',
          'Cut transport emissions through cooperative marketing and shared logistics',
          'Use the baseline to explore climate financing and carbon markets, such as ACORN',
          'Position Bundibugyo cocoa for climate-smart certification with robust monitoring and verification',
        ]},
        { type: 'callout', text: 'Many farmers are simply unaware that everyday choices — how they dispose of residues, apply fertiliser, or prepare land — carry a climate cost. Awareness and capacity building are part of the intervention, not a footnote.' },
        { type: 'highlight', text: 'Bundibugyo cocoa is already low-carbon and may be a net carbon sink. The opportunity is to stop burning residues and turn them into biochar, compost, and mulch — cutting emissions while feeding the soil.' },
      ],
    },
    {
      id: 'cocoa-gals',
      title: 'Module 5 — GALS: Gender Action Learning System',
      content: [
        { type: 'p', text: 'Cocoa in Bundibugyo is largely a family enterprise, but in Project A women operated 63% of cocoa land while holding little decision-making power, leadership, or ownership. The Gender Action Learning System (GALS) is a household-methodology that creates conditions for women to share decisions and resources — and it is a measured driver of the income gains the project recorded.' },
        { type: 'h', text: 'What GALS is' },
        { type: 'p', text: 'GALS is a visual, participant-led planning process. Farmers draw their own diaries and maps; the facilitator never holds the pen. It works through "pyramid" peer sharing — each champion shares with their immediate family and asks them to share onward, so reach grows exponentially from the same training effort.' },
        { type: 'h', text: 'The core GALS tools' },
        { type: 'value', title: 'VISION JOURNEY', text: 'A road drawn from the present (bottom-left) to a future vision (top-right). Farmers map 10 opportunities above the road and 10 constraints below, then set a one-year target and three-month SMART milestones with actions, tracking and revising as they go.' },
        { type: 'value', title: 'GENDER BALANCE TREE', text: 'A tree whose roots show who contributes which work (women, men, joint) and whose branches show who benefits from the expenditure. It exposes imbalances in work and reward, and the changes needed to make the tree "grow straight".' },
        { type: 'value', title: 'EMPOWERMENT LEADERSHIP MAP', text: 'Each person maps the people and institutions important in their life, marking social (red), economic (green), and power (blue/black) relationships. They identify what to keep, what to change, and whom to help or influence over the next three months.' },
        { type: 'value', title: 'MULTILANE HIGHWAY', text: 'Combines the tools at individual or household level — a framework of lanes, targets, and milestones that links the Vision Journey, Gender Balance Tree, and Empowerment Leadership Map into one tracked plan.' },
        { type: 'h', text: 'What GALS changed in households' },
        { type: 'list', items: [
          'Joint planning and decision-making — "Now we plan together as a family"',
          'Women gaining control over property, income, and resources',
          'Equal role-sharing in farm work, which farmers link to higher cocoa production',
          'Greater transparency and trust, reducing financial conflict',
          'Peace, unity, and shared responsibility within the home',
        ]},
        { type: 'callout', text: 'Women\'s safety comes first. In gender work — and especially where partner participation is sought — a woman should be able to opt out if involving her partner could increase her risk of abuse. Offer a confidential, one-to-one safety assessment with a trained staff member, and know the local referral services before you start.' },
        { type: 'h', text: 'Facilitating gender resistance' },
        { type: 'p', text: 'Field staff and gender champions will meet resistance. Engage it without confrontation: provide evidence; ask the group to reflect; work through the logic of the argument; and on the "culture" objection, note that culture is not fixed, varies across places, and is often shaped by those who benefit most — and is already being challenged from within communities.' },
        { type: 'highlight', text: 'GALS does not lecture farmers on gender; it hands them the pen. When households see their own work, reward, and power on paper, they change it themselves — and shared decisions show up as higher cocoa income.' },
      ],
    },
    {
      id: 'cocoa-vsla',
      title: 'Module 6 — VSLA & the EA$E Model',
      content: [
        { type: 'p', text: 'Village Savings and Loan Associations (VSLAs) are step one of EA$E — Economic and Social Empowerment. A VSLA is a self-selected, self-managing savings group that lets members who lack access to formal microfinance save, borrow, and build a financial cushion. In the 2025 survey, 161 of 169 farmers were VSLA members and around 90% saved through their group.' },
        { type: 'h', text: 'The EA$E model' },
        { type: 'pathway', title: 'STEP 1 — VSLA', text: 'Savings groups that build a loan fund and a safety net, giving members — especially women — access to and control over money.' },
        { type: 'pathway', title: 'STEP 2 — GENDER DISCUSSION SERIES', text: 'Facilitated discussions with members and their partners on household finance and decision-making (Module 7).' },
        { type: 'pathway', title: 'STEP 3 — BUSINESS SKILLS', text: 'Practical training so members invest savings and loans in viable businesses (Module 7).' },
        { type: 'callout', text: 'EA$E\'s theory of change is explicit: when women have more power to make decisions, they experience less violence in the home. VSLA is the financial foundation, but it is built to shift power, not just to save money.' },
        { type: 'h', text: 'How a VSLA is structured' },
        { type: 'list', items: [
          '15-25 self-selected members; participation is voluntary',
          'At least 3 of the 5 elected committee members should be female',
          'A chairperson, a record-keeper, a box-keeper, and 2 money-counters',
          'Members holding public office are not eligible for committee positions',
          'A time-bound cycle of 9-12 months, ending in a share-out',
        ]},
        { type: 'h', text: 'How saving and lending work' },
        { type: 'list', items: [
          'Members buy 1 to 5 shares per meeting, recorded immediately in a passbook',
          'Savings form a loan fund members borrow from and repay with a service charge (interest)',
          'A separate social fund, built from equal contributions, covers emergencies',
          'All transactions happen in front of the whole group — high accountability and transparency',
          'No grants are given: members\' own savings are the only source of funding, but they earn a good return',
        ]},
        { type: 'h', text: 'The three phases' },
        { type: 'value', title: 'PREPARATORY (3-4 WEEKS)', text: 'The field officer orients community leaders and administration, holds village-level awareness meetings, and forms and selects groups — making sure vulnerable people are represented.' },
        { type: 'value', title: 'INTENSIVE (14 WEEKS)', text: 'Groups work through the modules, elect leaders, agree a constitution, and learn to run social-fund, share-purchase, and loan meetings.' },
        { type: 'value', title: 'SUPERVISION (UP TO 36 WEEKS)', text: 'Monitoring and supervision across a development and a maturity phase — checking records, savings regularity, attendance, and committee roles.' },
        { type: 'h', text: 'The share-out' },
        { type: 'p', text: 'At cycle end, the box is counted and divided. New share value = total cash in the box / total number of shares bought. Each member receives their shares multiplied by that value. Members then decide whether to start another cycle, set a new share value, and contribute to kick-start the next loan fund.' },
        { type: 'h', text: 'What VSLA delivered for cocoa farmers' },
        { type: 'list', items: [
          'Capital to buy farm inputs and hire labour during peak cocoa periods',
          'Loans without collateral to start side businesses — food vending, fish trading, shops',
          'Income diversification to cover the cocoa off-season and emergencies',
          'A documented shift to a saving culture and access to credit',
        ]},
        { type: 'highlight', text: 'A VSLA turns a cocoa harvest into year-round resilience. The cash box funds inputs, labour, and side businesses — and because every shilling is counted in the open, it builds trust as well as savings.' },
      ],
    },
    {
      id: 'cocoa-business',
      title: 'Module 7 — Business Skills & Financial Empowerment',
      content: [
        { type: 'p', text: 'Saving and borrowing only build wealth if loans are invested well and households plan together. EA$E steps two and three — the Gender Discussion Series (GDS) and CEFE business-skills training — turn VSLA capital into viable enterprises and joint financial decisions.' },
        { type: 'h', text: 'Business skills: the CEFE approach' },
        { type: 'p', text: 'Business training follows CEFE — Competency-based Economies through Formation of Enterprise — an action-oriented, hands-on method that builds the entrepreneur, not just the business plan. The guide runs through six modules: Opening, Business Skills, Project Development, Marketing, Finance, and Closing.' },
        { type: 'list', items: [
          'Identify personal strengths and the skills a business needs, then match ideas to skills',
          'Turn community problems and unmet needs into business opportunities',
          'Test ideas against four questions: do I have the skills, is there demand, can people afford my price, can I finance it',
          'Keep simple money-in / money-out books with a running balance',
          'Suitable for motivated members with some income-generating experience and full attendance',
        ]},
        { type: 'h', text: 'Marketing: the four Ps' },
        { type: 'value', title: 'PLACE', text: 'The best location to reach customers and sell the product.' },
        { type: 'value', title: 'PRODUCT', text: 'What the customer needs, and whether features should change to meet demand.' },
        { type: 'value', title: 'PRICE', text: 'The price that attracts the most customers while covering costs — shaped by supply and demand.' },
        { type: 'value', title: 'PROMOTION', text: 'How customers learn about and are persuaded to buy the product.' },
        { type: 'p', text: 'The classic "cooking oil" exercise teaches supply and demand: as sellers leave the market and supply falls against steady demand, the price rises. Members then plan a market survey using the four Ps before committing a loan.' },
        { type: 'callout', text: 'Negative survey answers are valuable, not discouraging — they flag risk before a member invests a hard-won VSLA loan in a business no one wants.' },
        { type: 'h', text: 'The Gender Discussion Series' },
        { type: 'p', text: 'The GDS is a participatory, twelve-week behaviour-change process for members and their partners across three themes: household economy and the value of women; communication and negotiation; and planning and decision-making. It is not a formal training but a facilitated space to rethink attitudes — and it explicitly addresses the power dynamics behind violence in the home.' },
        { type: 'list', items: [
          'Define a "successful household" where every individual feels valued and resources are used jointly',
          'Distinguish needs from wants and set shared financial goals',
          'Practise win-win negotiation rather than win-lose or lose-lose outcomes',
          'Budget limited resources together, taking everyone\'s priorities into account',
          'Recognise harmful communication and the household costs of violence',
        ]},
        { type: 'h', text: 'Facilitation that works' },
        { type: 'list', items: [
          'Build a safe, confidential space with ground rules and respect; sharing is always a choice',
          'Replace "why" questions with "what happens when..." to open discussion rather than close it',
          'Use brainstorming, group work, case studies, and role play',
          'Be clear there are no allowances or per diems — only technical support',
          'Be prepared for disclosures of violence: respect, do not judge, do not counsel yourself, and know your referral services',
        ]},
        { type: 'h', text: 'Income diversification and market development' },
        { type: 'p', text: 'The income survey is explicit that business and financial-skills training is what lets farmers diversify beyond cocoa, especially during the off-season. This connects to ICAM\'s farmer business development (BDS) approach: annual and multi-year purchasing contracts that help cooperatives access credit, plus certification premiums (Fairtrade guarantees a minimum price; Rainforest Alliance guarantees a premium) that reward quality and sustainability.' },
        { type: 'highlight', text: 'VSLA provides the capital; business skills make it productive; the Gender Discussion Series makes sure the household decides together. Agronomy raises the yield — this is what turns that yield into a resilient livelihood.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Cocoa Field Scenarios',
    scenarios: [
      {
        situation: 'A field officer reviews the 2025 GHG baseline and proposes a campaign to cut fertiliser use as the top priority for reducing the Bundibugyo carbon footprint, reasoning that fertiliser is the obvious climate culprit.',
        options: [
          { text: 'Approve it — fertiliser is always the main emission source in farming.', correct: false, feedback: 'Not here. Fertiliser was only about 0.91% of emissions in the Bundibugyo baseline. Targeting it first would spend effort on a tiny fraction of the footprint.' },
          { text: 'Redirect the focus to crop-residue management, which is about 98.7% of emissions. Promote biochar, composting, and mulching of prunings and pod husks instead of burning or leaving them to rot. Keep fertiliser optimisation as a smaller, secondary measure.', correct: true, feedback: 'Correct. Crop residues drive almost the entire footprint at ~98.7%. Biochar, composting, and mulching cut emissions and build soil — the single highest-leverage intervention. Fertiliser and transport matter, but they are secondary.' },
          { text: 'Tell the team the footprint is already low, so no action is needed.', correct: false, feedback: 'The footprint is low overall, but residue burning is a clear, addressable hotspot — and turning residues into biochar also improves soil and opens carbon-finance options. Doing nothing wastes that opportunity.' },
        ],
      },
      {
        situation: 'A farmer\'s cocoa plot has aged and yields are falling. He tells you he is planning to clear an adjacent patch of forest to plant new cocoa, since the old trees "are finished".',
        options: [
          { text: 'Support clearing the forest — new land is the simplest way to restore yield.', correct: false, feedback: 'This drives deforestation, the very ESG risk the project exists to reduce, and would raise the farm\'s land-use emissions. The baseline\'s near-zero deforestation emissions are an asset to protect.' },
          { text: 'Work on rehabilitating the existing plot first — pruning, renewal and replanting of declining trees with improved clonal material, soil and fertility management, and integrating shade and fruit trees as agroforestry. Keeping the plot productive removes the reason to clear forest.', correct: true, feedback: 'Correct. GAP that preserves plantation productivity is itself an anti-deforestation measure. Renewal, clonal planting material, and agroforestry restore yield and add income without clearing land.' },
          { text: 'Tell him to abandon cocoa and switch crops.', correct: false, feedback: 'Defeatist and unnecessary. The plot can be rehabilitated, and cocoa is his main income and a prized origin. Abandoning it throws away the project\'s entire premise.' },
        ],
      },
      {
        situation: 'A woman in a VSLA wants to invite her husband to the Gender Discussion Series as encouraged, but privately tells a gender champion she is afraid he may react violently if pressured to attend.',
        options: [
          { text: 'Insist she invite him — partner attendance is critical to the GDS, so it should not be optional.', correct: false, feedback: 'This puts the project\'s method ahead of the woman\'s safety. EA$E is explicit that women\'s safety is the first concern and partners\' participation must never be forced where it raises the risk of abuse.' },
          { text: 'Respect her right to opt out of inviting her partner, and offer a confidential one-to-one safety assessment with a trained staff member. Make sure she knows the local health, psychosocial, and legal referral services.', correct: true, feedback: 'Correct. Women\'s safety comes first. A woman can opt out of involving her partner; offer a confidential safety assessment and have referral services mapped before the session. The series does not require disclosure.' },
          { text: 'Counsel her yourself about how to manage her husband\'s temper.', correct: false, feedback: 'Field staff and champions are not counsellors. The guidance is clear: respect, do not judge, do not try to counsel them yourself — refer to trained services.' },
        ],
      },
      {
        situation: 'A new VSLA is forming. A respected, well-off community member who also holds a local public office wants to chair the group, and several members assume she should because she is influential.',
        options: [
          { text: 'Appoint her as chairperson by acclamation to keep the influential member on side.', correct: false, feedback: 'Two problems. Members holding public office are not eligible for committee positions, and committees should be elected, not appointed by acclamation — both protect the group\'s independence and accountability.' },
          { text: 'Explain that public-office holders are not eligible for committee roles, and run a proper election with at least two nominees per position and a secret vote, ensuring at least 3 of the 5 committee members are women.', correct: true, feedback: 'Correct. The VSLA rules bar public-office holders from the committee, require genuine elections with multiple nominees, and set a minimum of 3 female committee members of 5 — all to keep the group accountable and women-led.' },
          { text: 'Skip elections entirely since the group is small and everyone knows each other.', correct: false, feedback: 'Elections, a written constitution, and clear roles are foundational to VSLA accountability and transparency. Skipping them undermines the model from day one.' },
        ],
      },
      {
        situation: 'A VSLA member has saved diligently and wants to take a loan to start a business selling a product. She is set on the idea and asks you to approve the loan quickly before she has done any market research.',
        options: [
          { text: 'Approve it immediately — she has saved well and deserves the loan.', correct: false, feedback: 'Saving discipline is not the same as a viable business. Investing a loan without testing demand is exactly the risk the business-skills training is designed to prevent.' },
          { text: 'Encourage her to run a quick market survey using the four Ps first — checking demand, what people will pay, supply and competition, and the best place to sell. Treat negative findings as useful early warnings before she commits her savings.', correct: true, feedback: 'Correct. CEFE training tests an idea against demand, affordability, supply, and skills before a loan is committed. Negative answers flag risk early and protect her hard-won savings.' },
          { text: 'Tell her business is too risky and she should just keep saving.', correct: false, feedback: 'Discouraging enterprise defeats the purpose of EA$E, which exists to turn savings into productive, diversified income. The goal is a well-planned business, not no business.' },
        ],
      },
      {
        situation: 'A buyer offers a premium for certified, well-fermented cocoa, but a group of farmers is fermenting and drying beans individually at home, with inconsistent quality and recurring losses to rain and theft.',
        options: [
          { text: 'Advise farmers to sell unfermented wet beans immediately at harvest to avoid the hassle of processing.', correct: false, feedback: 'This forfeits the fermentation that develops flavour and the premium the buyer is offering, and locks in the lowest-value product. Quality handling is where agronomy converts into income.' },
          { text: 'Channel beans through the central collection and fermentation centres for consistent quality, and reinforce GAP and certification (organic / Rainforest Alliance) so the crop qualifies for the premium. Home processing can lose up to 30% of the harvest.', correct: true, feedback: 'Correct. Centralised fermentation and drying standardise quality, cut the up-to-30% home-processing losses, and meet the certification standards that unlock premiums. That is the ICAM model in Bundibugyo, Hoima, and Mukono.' },
          { text: 'Tell farmers quality does not matter as long as volume is high.', correct: false, feedback: 'Quality is precisely what the premium pays for. Poor fermentation yields a minimal selling price regardless of volume — volume of low-grade beans does not capture the premium.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'The Solidaridad ECA cocoa project is implemented in which district?', options: ['Hoima District', 'Mukono District', 'Bundibugyo District', 'Kasese District'], answer: 2 },
    { q: 'According to the 2025 GHG baseline, the largest source of emissions on Bundibugyo cocoa farms is:', options: ['Fertiliser use', 'Crop residue management (~98.7%)', 'Transport', 'Fossil-fuel energy'], answer: 1 },
    { q: 'The carbon footprint of Bundibugyo cocoa per kilogram of beans was estimated at about:', options: ['0.1 kg CO2e/kg', '1.01 kg CO2e/kg', '5 kg CO2e/kg', '20 kg CO2e/kg'], answer: 1 },
    { q: 'The soil carbon change in the baseline was about -0.82 tCO2e, which indicates the farms may be:', options: ['A major emitter', 'A net carbon sink', 'Carbon neutral by design', 'Unmeasurable'], answer: 1 },
    { q: 'Which three practices are recommended to address crop-residue emissions?', options: ['Burning, ploughing, fallowing', 'Biochar, composting, mulching/cover crops', 'Irrigation, terracing, liming', 'Spraying, fencing, weeding'], answer: 1 },
    { q: 'EA$E stands for:', options: ['Environmental Action and Sustainable Ecology', 'Economic and Social Empowerment', 'Extension Advisory and Seed Enterprise', 'Equity, Agriculture and Sustainable Enterprise'], answer: 1 },
    { q: 'A standard VSLA group has how many members?', options: ['5-10', '15-25', '50-100', 'Unlimited'], answer: 1 },
    { q: 'In a VSLA committee of five, the minimum number of women should be:', options: ['1', '2', '3', '5'], answer: 2 },
    { q: 'A VSLA savings cycle is typically:', options: ['1-2 months', '9-12 months', '3 years', 'Open-ended'], answer: 1 },
    { q: 'The three steps of the EA$E model are:', options: ['Seed, fertiliser, harvest', 'VSLA, Gender Discussion Series, Business Skills', 'Plan, plant, profit', 'Save, spend, share'], answer: 1 },
    { q: 'The Gender Action Learning System (GALS) tool that maps a road from present to future with opportunities and constraints is the:', options: ['Gender Balance Tree', 'Empowerment Leadership Map', 'Vision Journey', 'Multilane Highway'], answer: 2 },
    { q: 'The "four Ps" in EA$E marketing training are:', options: ['People, Planet, Profit, Purpose', 'Place, Price, Product, Promotion', 'Plan, Prepare, Produce, Promote', 'Price, Profit, Partner, Plan'], answer: 1 },
    { q: 'In the household income survey, average cocoa income per household rose from 2023 to 2025 from about:', options: ['UGX 3.0m to UGX 13.0m', 'UGX 1.0m to UGX 2.0m', 'UGX 13.0m to UGX 3.0m', 'No change'], answer: 0 },
    { q: 'Poor on-farm fermentation, drying, and storage of cocoa in Bundibugyo can cause harvest losses of up to:', options: ['About 5%', 'About 30%', 'About 60%', 'About 90%'], answer: 1 },
    { q: 'In EA$E and GALS gender work, the first concern when seeking partner participation is:', options: ['Maximising attendance numbers', 'Women\'s safety, allowing opt-out and confidential safety assessment', 'Providing per diems to attract men', 'Disclosing all cases of violence publicly'], answer: 1 },
  ],
});



COURSES.push({
  id: 'cotton-textile',
  title: 'Cotton & Textile: Crop, Standard & Value Chain',
  subtitle: 'Better Cotton and the fashion value chain',
  category: 'Commodities',
  icon: commodityIcon(cottonIcon),
  duration: '1 hr 15 min',
  description: 'A six-module course on cotton and the fashion value chain for Solidaridad ECA staff who support field teams, ginners, cooperatives, and textile-sector partners. It frames cotton within ECA\'s Fashion sector (cotton, leather, textiles) in Ethiopia and Uganda, and grounds practice in the Better Cotton Standard, cotton good agricultural practice (GAP), integrated pest management, responsible ginning, fibre quality, decent work, and the cotton-to-garment chain that links farms to EUDR- and CSDDD-facing markets.',
  lessons: [
    {
      id: 'cotton-overview',
      title: 'Module 1 — Cotton, Textiles & Solidaridad ECA',
      content: [
        { type: 'p', text: 'Cotton is the foundation of Solidaridad ECA\'s Fashion sector, which spans cotton, leather, and textiles. In ECA, cotton and the wider fashion value chain are programme priorities in Ethiopia (cotton, leather and a large textile and garment sector) and Uganda (cotton and leather). This course is Solidaridad ECA\'s own curriculum framing for staff — not a reproduction of any single training manual.' },
        { type: 'callout', text: 'There is no single source manual behind this course. It is built from Solidaridad ECA\'s programme framing plus well-established sector good practice — chiefly the Better Cotton Standard. Treat qualitative statements as guidance, and always confirm local agronomy, rates, and regulations with national partners.' },
        { type: 'h', text: 'Why cotton matters in ECA' },
        { type: 'list', items: [
          'Cash crop and income source for hundreds of thousands of smallholder households across the region',
          'The raw material that feeds Ethiopia\'s textile and garment industry — a major formal employer, especially of women',
          'A crop where sustainability gains are unusually large, because conventional cotton is input-intensive',
          'A value chain Solidaridad works end-to-end: from seed cotton on the farm, through ginning and spinning, to fabric and finished garments',
        ]},
        { type: 'h', text: 'The sustainability case for cotton' },
        { type: 'p', text: 'Cotton is one of the most pesticide-intensive crops in the world and is often grown with heavy irrigation, so the environmental and social stakes are high. The opportunity is equally large: better agronomy and integrated pest management can sharply cut input use while protecting or raising yields.' },
        { type: 'pathway', title: 'INPUT INTENSITY', text: 'Cotton accounts for a disproportionate share of global insecticide use relative to the area it occupies. Reducing pesticide reliance through IPM is the single biggest environmental lever on the crop.' },
        { type: 'pathway', title: 'WATER', text: 'Cotton is thirsty. Where it is irrigated, water-use efficiency — not just total water applied — determines whether production is sustainable. Rain-fed systems depend on soil moisture management.' },
        { type: 'pathway', title: 'DECENT WORK', text: 'Cotton and textiles both carry real labour risks — child and forced labour in seed-cotton picking, and wage, safety, and harassment concerns on factory floors. Decent work runs through the whole chain.' },
        { type: 'pathway', title: 'CONTAMINATION', text: 'Cotton is sold on fibre quality. Contamination by plastic, hair, or foreign matter, and mixing of varieties, destroy value at the gin and the mill. Quality is a sustainability and an income issue at once.' },
        { type: 'h', text: 'Solidaridad and the cotton Round Tables' },
        { type: 'p', text: 'Solidaridad has a long history of building sector-wide platforms. In its sector-collaboration phase it co-founded multi-stakeholder Round Tables for soy, palm oil, sugarcane, and cotton — bringing producers, buyers, and civil society together to agree on what sustainable production means. That history underpins Solidaridad\'s work with the Better Cotton system today.' },
        { type: 'h', text: 'Where this fits in MASP' },
        { type: 'p', text: 'Fashion is one of the commodities under ECA\'s integrated supply-chain transformation strategy, with end-to-end, country-specific approaches aligned to EU rules such as the EU Deforestation Regulation (EUDR) and the Corporate Sustainability Due Diligence Directive (CSDDD). Solidaridad\'s market work in fashion includes partnerships with brands such as Decathlon and H&M.' },
        { type: 'pathway', title: 'DIGITAL TOOLS', text: 'The same digital backbone used across ECA applies to cotton: Solichain for traceability, Uwanjani for field data, J\'Funze for staff learning, and farmer IDs that link a grower to their plot and their training record.' },
        { type: 'pathway', title: 'INTEGRATED CHAIN', text: 'Solidaridad does not stop at the farm gate. Ginning, spinning, fabric, and garment stages are all part of the transformation — because a sustainable bale is worth little if it enters an exploitative mill.' },
        { type: 'highlight', text: 'Cotton is high-leverage: it is input-heavy and labour-sensitive, so getting the practices right delivers outsized gains for farmers, workers, and the environment.' },
      ],
    },
    {
      id: 'cotton-agronomy',
      title: 'Module 2 — Cotton Agronomy & Good Agricultural Practice',
      content: [
        { type: 'p', text: 'Sustainable cotton starts in the field. Good agricultural practice (GAP) for cotton covers variety and seed, establishment and plant population, soil health, and water — the decisions that set the ceiling on both yield and fibre quality before the first boll forms.' },
        { type: 'h', text: 'Variety and seed' },
        { type: 'list', items: [
          'Choose a variety suited to the agroclimatic zone, season length, and end-market fibre requirements',
          'Use quality, certified or otherwise verified seed — it manages germination, vigour, and varietal purity',
          'Keep varieties separate; mixing varieties downgrades the lint and complicates ginning and traceability',
          'Match maturity class to the rainfall window so bolls open in dry weather, not in the rains',
          'Where seed is delinted and treated, follow safe-handling guidance for the treatment used',
        ]},
        { type: 'h', text: 'Crop requirements' },
        { type: 'list', items: [
          'Cotton is a warm-season crop needing a long, warm, frost-free growing period',
          'It needs adequate moisture during establishment, squaring, and boll development, then dry weather for boll opening and picking',
          'Well-drained soils with good structure suit cotton; waterlogging damages roots and bolls',
          'Cotton fits well in rotation — breaking pest and disease cycles and spreading labour and income across crops',
        ]},
        { type: 'callout', text: 'Cotton sold for spinning is graded on fibre length, strength, and cleanliness. Variety choice and timing are the first determinants of fibre quality — you cannot fix a poor variety choice later in the season.' },
        { type: 'h', text: 'Establishment and plant population' },
        { type: 'pathway', title: 'PLANT WHEN MOISTURE IS RIGHT', text: 'Plant into adequate soil moisture once the rains are established, or into irrigation. Even establishment gives an even crop that opens together — easier to pick clean and to manage for pests.' },
        { type: 'pathway', title: 'GET THE POPULATION RIGHT', text: 'Correct row and plant spacing for the variety and conditions gives a canopy that captures light, suppresses weeds, and ventilates to limit disease. Too dense invites pests and rot; too sparse wastes land and yield.' },
        { type: 'h', text: 'Soil health' },
        { type: 'list', items: [
          'Build soil organic matter with residues, manure, and rotation — healthy soil holds water and supplies nutrients',
          'Use soil testing to guide nutrient decisions rather than blanket fertiliser application',
          'Protect against erosion on slopes with contour practices and ground cover',
          'Apply the right nutrient source, rate, time, and place — over-application wastes money and pollutes water',
        ]},
        { type: 'h', text: 'Water-use efficiency' },
        { type: 'p', text: 'Because cotton is a thirsty crop, the goal is more crop per drop, not simply more water. Where cotton is irrigated, scheduling to crop need and reducing losses matter as much as the source of the water.' },
        { type: 'value', title: 'SCHEDULE TO NEED', text: 'Irrigate according to crop stage and soil moisture, with the heaviest demand around flowering and boll fill. Avoid late irrigation that delays boll opening and invites rot.' },
        { type: 'value', title: 'CUT LOSSES', text: 'Reduce evaporation and runoff — efficient furrow, drip, or scheduled methods deliver water to the root zone, not the air or the drain.' },
        { type: 'value', title: 'MANAGE RAIN-FED MOISTURE', text: 'In rain-fed cotton, mulching, conservation tillage, and timely weeding conserve the soil moisture the crop depends on.' },
        { type: 'highlight', text: 'GAP sets the ceiling: variety, even establishment, healthy soil, and efficient water decide how good the crop can ever be.' },
      ],
    },
    {
      id: 'cotton-ipm',
      title: 'Module 3 — Integrated Pest Management & Responsible Input Use',
      content: [
        { type: 'p', text: 'Cotton is notorious for heavy pesticide use, and unmanaged spraying harms farmers, workers, beneficial insects, water, and the household budget. Integrated Pest Management (IPM) is the core of sustainable cotton: use every tool available and reach for chemicals only when they are genuinely justified.' },
        { type: 'h', text: 'What IPM means' },
        { type: 'p', text: 'IPM combines cultural, biological, mechanical, and — only as a last resort — chemical controls, guided by scouting and economic thresholds rather than a fixed spray calendar. It is both more sustainable and, over a season, usually cheaper than calendar spraying.' },
        { type: 'pathway', title: 'CULTURAL CONTROL', text: 'Practices that prevent pest build-up: rotation, timely planting and harvest, destroying crop residues that harbour pests, field hygiene, and a healthy, evenly spaced crop that resists damage.' },
        { type: 'pathway', title: 'BIOLOGICAL CONTROL', text: 'Protecting and using natural enemies — predators and parasitoids that keep pests in check. Broad-spectrum spraying destroys these allies and can trigger worse outbreaks of secondary pests.' },
        { type: 'pathway', title: 'MECHANICAL & PHYSICAL', text: 'Hand-picking pests, traps, and removing infested material. Labour-intensive but effective on small plots and free of chemical cost or residue.' },
        { type: 'pathway', title: 'CHEMICAL CONTROL', text: 'Used only when scouting shows damage crossing an economic threshold. Choose a registered, selective product, target it, and respect intervals — never spray on schedule by default.' },
        { type: 'h', text: 'Scout before you spray' },
        { type: 'list', items: [
          'Walk the field regularly and check plants at several points, not just the edges',
          'Identify the pest — many insects in a cotton field are harmless or beneficial',
          'Estimate the level of damage and compare it to the threshold for that pest and stage',
          'Spray only if the threshold is crossed; otherwise let natural enemies do the work',
        ]},
        { type: 'callout', text: 'Routine calendar spraying is the practice IPM exists to replace. It wastes money, kills beneficial insects, drives resistance, and poisons applicators and water. Scout first; spray only on evidence.' },
        { type: 'h', text: 'Responsible and safe input use' },
        { type: 'p', text: 'Where pesticides are used, responsible use protects the applicator, the community, and the environment. The Better Cotton system bans the most hazardous pesticides and requires that any pesticide use be progressively reduced and handled safely.' },
        { type: 'list', items: [
          'Use only products registered for cotton in the country — never banned or unidentified chemicals',
          'Read and follow the label for rate, timing, and pre-harvest interval',
          'Wear appropriate protective equipment — gloves, mask, eye protection, long sleeves',
          'Keep children, pregnant women, and untrained people away from handling and spraying',
          'Triple-rinse and safely dispose of empty containers; never reuse them for food or water',
          'Store chemicals securely, away from food, water, and living areas',
          'Wash thoroughly after handling and keep records of every application',
        ]},
        { type: 'callout', text: 'Highly hazardous pesticides have no place in a sustainable cotton programme. If a farmer is using a banned or unlabelled product, stopping that use is an immediate priority, not a long-term goal.' },
        { type: 'highlight', text: 'On cotton, the sprayer is the last resort, not the first. Scout, protect natural enemies, and treat only on a crossed threshold with a safe, registered product.' },
      ],
    },
    {
      id: 'cotton-better-cotton',
      title: 'Module 4 — Better Cotton: Standard, Principles & Licensing',
      content: [
        { type: 'p', text: 'Better Cotton is the world\'s most widely used sustainability programme for cotton, run by the Better Cotton Initiative. It sets a field-level standard, trains and licenses farmers, and connects sustainably grown cotton to global brands. Understanding how the system works lets ECA staff support farmers and partners through licensing credibly.' },
        { type: 'h', text: 'How the system works' },
        { type: 'list', items: [
          'A standard defines good practice across environmental, social, and management dimensions',
          'Farmers organised into groups are trained, supported, and assessed against the standard',
          'Those who meet the requirements are licensed to sell their cotton as Better Cotton',
          'Volumes are connected to demand from brands and retailers committed to sourcing more sustainable cotton',
        ]},
        { type: 'h', text: 'The principles of the standard' },
        { type: 'p', text: 'The Better Cotton Principles and Criteria set out what a sustainably managed cotton farm looks like. They are organised around a set of principles that, together, cover the whole farm system:' },
        { type: 'list', items: [
          'Crop protection — minimise harm from crop-protection practices, with IPM and a ban on the most hazardous pesticides',
          'Water — promote water stewardship and efficient, responsible water use',
          'Soil health — care for and improve the soil over time',
          'Biodiversity and land use — enhance biodiversity and use land responsibly',
          'Fibre quality — preserve and grow the quality and value of the lint',
          'Decent work — protect the rights, safety, and wellbeing of farmers and workers',
          'Effective management — manage the farm and the producer group well, with credible data',
        ]},
        { type: 'callout', text: 'Decent work is a principle of the standard, not an optional add-on. Child labour and forced labour are unacceptable, and farms must work toward safe conditions and fair treatment of all workers.' },
        { type: 'h', text: 'Mass balance and the chain of custody' },
        { type: 'p', text: 'Better Cotton uses a mass-balance chain of custody. This is an important nuance for staff to explain accurately to farmers and partners.' },
        { type: 'pathway', title: 'WHAT MASS BALANCE IS', text: 'Volumes of Better Cotton are tracked through the supply chain by accounting, so that the amount sourced matches the amount grown — but the physical fibre may be mixed with conventional cotton along the way.' },
        { type: 'pathway', title: 'WHAT IT IS NOT', text: 'Mass balance does not guarantee that a specific garment physically contains Better Cotton fibre. It guarantees that demand pulls an equivalent volume of more sustainable cotton into the system, rewarding the farmers who grew it.' },
        { type: 'h', text: 'Licensing and the field officer\'s role' },
        { type: 'value', title: 'GROUP STRUCTURE', text: 'Smallholders are licensed as groups with shared internal management. The group structure carries the training, record-keeping, and self-assessment that licensing depends on.' },
        { type: 'value', title: 'CONTINUOUS IMPROVEMENT', text: 'A licence is not a one-off badge. Farmers are expected to keep improving against the standard season on season; assessment is ongoing.' },
        { type: 'value', title: 'CREDIBLE DATA', text: 'Results — input use, yields, training, outcomes — must be recorded honestly. Weak or invented data undermines the licence and the brand relationships behind it.' },
        { type: 'highlight', text: 'Better Cotton trains, licenses, and connects farmers to demand. Explain mass balance honestly: it pulls sustainable volume into the chain, it does not trace a single fibre to a single shirt.' },
      ],
    },
    {
      id: 'cotton-harvest-ginning',
      title: 'Module 5 — Harvest, Fibre Quality, Contamination & Ginning',
      content: [
        { type: 'p', text: 'Cotton is sold on quality, and quality is made or lost between the open boll and the bale. Careful harvesting, ruthless contamination control, and responsible ginning protect the value the farmer worked all season to create.' },
        { type: 'h', text: 'Harvesting for quality' },
        { type: 'list', items: [
          'Pick only fully open, mature, dry bolls — picking damp cotton invites staining and mould',
          'Pick clean: leave leaves, bracts, and trash on the plant, not in the bag',
          'Pick in several rounds as bolls open, rather than stripping the whole plant at once',
          'Keep first-grade and stained or lower-grade cotton separate from the moment of picking',
          'Do not mix varieties — varietal mixing is a quality defect that follows the cotton all the way to the mill',
        ]},
        { type: 'h', text: 'The enemy: contamination' },
        { type: 'p', text: 'Contamination is foreign matter in the seed cotton or lint, and it is one of the costliest, most avoidable quality problems in the chain. A few strands of the wrong material can downgrade a whole bale and damage spinning machinery.' },
        { type: 'callout', text: 'The worst contaminant is polypropylene from woven plastic sacks and twine. It is nearly invisible in white lint, does not take dye, and ruins fabric. Use cotton bags and natural twine for picking, transport, and storage — never plastic woven sacks.' },
        { type: 'list', items: [
          'Keep plastic, hair, jute, leather, sweet wrappers, and string out of the cotton',
          'Use clean cotton picking bags and clean storage; sweep collection points',
          'Train pickers — most contamination enters by hand during picking and handling',
          'Store seed cotton dry and off the ground, protected from rain and dust',
        ]},
        { type: 'h', text: 'What buyers grade' },
        { type: 'pathway', title: 'FIBRE LENGTH (STAPLE)', text: 'Longer staple spins into finer, stronger yarn and earns more. Variety and growing conditions set the staple; picking and ginning must preserve it.' },
        { type: 'pathway', title: 'STRENGTH & MICRONAIRE', text: 'Fibre strength and fineness (micronaire) determine spinning performance. Immature or stressed cotton scores poorly.' },
        { type: 'pathway', title: 'CLEANLINESS & COLOUR', text: 'Trash content, staining, and contamination cut the grade directly. Clean, white, well-handled cotton is worth more — this is where farm-level discipline pays off.' },
        { type: 'h', text: 'Responsible ginning' },
        { type: 'p', text: 'Ginning separates lint from seed and is the first processing step. A well-run gin protects fibre quality, keeps batches and varieties separate for traceability, and operates safely. A poorly run gin destroys value the farm created.' },
        { type: 'list', items: [
          'Keep the gin clean and well maintained — gin trash and worn equipment damage fibre',
          'Set the gin correctly for moisture and trash; over-aggressive ginning breaks fibre and lowers the grade',
          'Keep varieties and grades separate through the gin to protect quality and traceability',
          'Manage worker safety — moving machinery, dust, and fire risk are all serious in a gin',
          'Maintain records linking bales back to producer groups for chain-of-custody and EUDR-style due diligence',
        ]},
        { type: 'callout', text: 'Cotton dust and lint are highly flammable, and gin machinery is dangerous. Fire prevention, machine guarding, and worker protection are not optional in a responsible ginning operation.' },
        { type: 'highlight', text: 'Quality is built at the farm and protected at the gin. Pick clean, keep plastic out, keep varieties apart, and gin carefully — every defect downstream traces back upstream.' },
      ],
    },
    {
      id: 'cotton-fashion-value-chain',
      title: 'Module 6 — The Fashion Value Chain, Decent Work & Market Access',
      content: [
        { type: 'p', text: 'Cotton becomes fashion through a long chain: seed cotton is ginned into lint, lint is spun into yarn, yarn is woven or knitted into fabric, and fabric is cut and sewn into garments. Solidaridad works across this whole chain — and Ethiopia\'s textile and garment sector is a focus of that work in ECA.' },
        { type: 'h', text: 'From boll to garment' },
        { type: 'pathway', title: 'GINNING', text: 'Seed cotton is separated into lint and seed. Lint is baled for spinning; seed goes to oil and feed. The first point where farm quality is preserved or lost.' },
        { type: 'pathway', title: 'SPINNING', text: 'Lint is cleaned, carded, and spun into yarn. Fibre length, strength, and cleanliness from the farm directly set what yarn can be made and at what value.' },
        { type: 'pathway', title: 'FABRIC', text: 'Yarn is woven or knitted, then dyed and finished into fabric. A wet-processing stage with significant water, energy, and chemical impacts to manage responsibly.' },
        { type: 'pathway', title: 'GARMENT', text: 'Fabric is cut and sewn into clothing, often for export. This is where most factory employment — and most of the decent-work risk — sits, especially for women workers.' },
        { type: 'h', text: 'Decent work across the chain' },
        { type: 'p', text: 'Labour risks differ by stage but run the whole length of the chain. The ILO core conventions — no child labour, no forced labour, freedom of association, and no discrimination — are the floor everywhere.' },
        { type: 'list', items: [
          'Seed-cotton picking carries child-labour and forced-labour risks that must be actively prevented',
          'Ginning carries machinery, dust, and fire hazards demanding strong occupational safety',
          'Textile and garment factories — where women dominate the floor — carry wage, working-hours, safety, and harassment concerns',
          'A living wage, not just a legal minimum, is the goal for workers across the chain',
          'Freedom of association lets workers organise and bargain — a structural protection, not a favour',
        ]},
        { type: 'callout', text: 'In Ethiopia\'s textile sector women dominate factory-floor work but face safety, wage, and harassment concerns; in cotton farming, women supply field labour while men often control marketing and income. Effective programming protects women\'s position precisely where their work meets cash.' },
        { type: 'h', text: 'Traceability and due diligence' },
        { type: 'p', text: 'European market rules increasingly require companies to know and account for the conditions under which their goods are made. Cotton and fashion sit squarely inside this shift.' },
        { type: 'pathway', title: 'EUDR', text: 'The EU Deforestation Regulation requires that covered products are not linked to deforestation and are traceable to plot of origin. Cotton itself is not a primary EUDR commodity, but the traceability discipline — knowing the origin plot — is exactly what fashion supply chains are being pushed toward.' },
        { type: 'pathway', title: 'CSDDD', text: 'The Corporate Sustainability Due Diligence Directive requires large companies to identify, prevent, and account for human-rights and environmental harms in their value chains. For fashion that means scrutiny of labour conditions from the farm to the factory.' },
        { type: 'pathway', title: 'WHAT IT MEANS FOR ECA', text: 'Farmer IDs, plot mapping, group records, and Solichain traceability are not paperwork for its own sake — they are what let ECA cotton and textiles meet buyer due-diligence requirements and keep market access.' },
        { type: 'h', text: 'Market access and value addition' },
        { type: 'value', title: 'BRAND PARTNERSHIPS', text: 'Solidaridad\'s market work in fashion includes partnerships with brands such as Decathlon and H&M, connecting sustainably produced cotton and textiles to committed buyers.' },
        { type: 'value', title: 'VALUE ADDITION IN-REGION', text: 'Ginning, spinning, and garment manufacture in Ethiopia keep more of the chain\'s value — and its jobs — in the region rather than exporting raw lint.' },
        { type: 'value', title: 'CREDIBLE CLAIMS', text: 'Market access depends on claims buyers can trust. Honest data, real traceability, and genuine improvement against standards like Better Cotton are what sustain a premium and a relationship.' },
        { type: 'highlight', text: 'Sustainable cotton is only worth its premium if the whole chain holds: clean fibre, decent work from farm to factory, and traceability that satisfies EUDR- and CSDDD-facing buyers.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Cotton & Textile Field Scenarios',
    scenarios: [
      {
        situation: 'A farmer in your Better Cotton group sprays a broad-spectrum insecticide every week on a fixed calendar, whether or not he sees pests. He says it keeps his crop safe and he has always done it this way.',
        options: [
          { text: 'Endorse the routine — regular spraying prevents outbreaks before they start.', correct: false, feedback: 'Calendar spraying is exactly what IPM exists to replace. It kills the natural enemies that control pests, drives resistance, poisons the applicator and water, and wastes money — and it can trigger worse secondary outbreaks.' },
          { text: 'Introduce scouting and economic thresholds — walk the field, identify pests, and spray only when damage crosses the threshold, choosing a registered, selective product. Explain that protecting natural enemies usually means fewer sprays and lower costs.', correct: true, feedback: 'Correct. IPM is scout-first: cultural and biological controls do most of the work, and chemicals are a last resort used only on a crossed threshold. This protects the farmer\'s health and budget and is required under the Better Cotton crop-protection principle.' },
          { text: 'Tell him to keep spraying weekly but switch to a cheaper product.', correct: false, feedback: 'A cheaper product sprayed on the same wasteful calendar solves nothing — and a cheaper, less selective chemical may be more hazardous. The problem is the calendar, not the price.' },
        ],
      },
      {
        situation: 'At a collection point you notice pickers tipping seed cotton out of woven polypropylene sacks and tying bundles with plastic twine. The cotton looks clean and white otherwise.',
        options: [
          { text: 'Leave it — the cotton looks clean, so there is no quality problem.', correct: false, feedback: 'Polypropylene from woven sacks and plastic twine is the worst cotton contaminant. It is nearly invisible in white lint, will not take dye, and ruins fabric — a few strands can downgrade a whole bale.' },
          { text: 'Stop the practice immediately and switch to cotton picking bags and natural twine for picking, transport, and storage. Train the pickers on why plastic is the most damaging contaminant of all.', correct: true, feedback: 'Correct. Contamination control is a fibre-quality and income issue, and plastic is the headline offender. Cotton bags and natural twine, plus picker training, are the fix — and it pays off at the gin and the mill.' },
          { text: 'Note it for the next training session in a few months.', correct: false, feedback: 'Contamination enters during this picking, not next season. Every bale handled in plastic between now and then is at risk. This needs an immediate change, not a deferred note.' },
        ],
      },
      {
        situation: 'A cooperative leader asks you to confirm that a garment made from their Better Cotton will physically contain the exact fibre their members grew, so they can tell members their cotton is in a named brand\'s shirts.',
        options: [
          { text: 'Confirm it — Better Cotton is fully physically traceable from their field to the finished shirt.', correct: false, feedback: 'This misrepresents the system. Better Cotton uses mass balance, not physical traceability, so a specific garment is not guaranteed to contain their physical fibre. Promising otherwise damages credibility when it is discovered.' },
          { text: 'Explain mass balance honestly: their licensed volume pulls an equivalent amount of more sustainable cotton into the supply chain and rewards them for growing it, but the physical fibre may be blended along the way. The benefit is real demand and reward, not a single traced fibre.', correct: true, feedback: 'Correct. Mass balance matches sourced volume to grown volume by accounting while allowing physical blending. Explaining it accurately protects trust with members and with buyers — and it is still a real, valuable benefit.' },
          { text: 'Avoid the question and tell them traceability details are confidential.', correct: false, feedback: 'Dodging the question leaves a false impression and erodes trust. Staff should be able to explain mass balance plainly; it is a core feature of the system, not a secret.' },
        ],
      },
      {
        situation: 'During a farm visit at picking time you see two children, clearly of school age, picking seed cotton during school hours. The household head says all hands are needed to bring the crop in before the rains.',
        options: [
          { text: 'Accept it as a normal seasonal labour peak and move on.', correct: false, feedback: 'Child labour is a violation of the ILO core conventions and is unacceptable under the Better Cotton decent-work principle. A genuine labour peak is not a justification for keeping children out of school to pick cotton.' },
          { text: 'Treat it as a serious decent-work issue: address it with the household, follow your programme\'s child-labour remediation procedure, and look at the underlying labour and income pressures so the household has a real alternative to relying on children.', correct: true, feedback: 'Correct. Child labour must be actively prevented and remediated, not normalised. The lasting fix addresses why the household depends on child labour — labour planning, income, and adult workforce — alongside stopping the immediate harm.' },
          { text: 'Quietly remove the household from the programme to protect the group\'s licence.', correct: false, feedback: 'Expelling the household hides the problem rather than remediating it and leaves the children no better off. The decent-work approach is to address and remediate the situation, supported by the group\'s management system.' },
        ],
      },
      {
        situation: 'A ginner you support runs the gin aggressively to push volume through quickly, and mixes cotton from different varieties and grades into combined batches to save handling time. He reports complaints from a mill about fibre quality.',
        options: [
          { text: 'Tell him fibre quality is set on the farm, so the gin settings and batching are not the issue.', correct: false, feedback: 'The farm sets the potential, but the gin preserves or destroys it. Over-aggressive ginning breaks fibre and lowers the grade, and mixing varieties and grades is itself a quality defect — both are squarely the gin\'s responsibility.' },
          { text: 'Work with him to set the gin correctly for moisture and trash, keep varieties and grades separate through the gin, and maintain records linking bales to producer groups. Connect the mill\'s complaint directly to these practices.', correct: true, feedback: 'Correct. Responsible ginning means gentle, correctly-set processing, strict separation of varieties and grades, and batch records for traceability. These directly fix the mill\'s complaint and protect the value the farms created.' },
          { text: 'Advise him to keep batching everything together but offer the mill a discount.', correct: false, feedback: 'A discount accepts and entrenches the quality loss instead of fixing it. Correct gin setup and variety/grade separation recover value rather than giving it away — and protect the buyer relationship.' },
        ],
      },
      {
        situation: 'A textile buyer in Europe tells an Ethiopian garment partner they will need farm-level origin and labour-condition information across the supply chain to keep ordering, citing new due-diligence rules. The partner asks whether this is worth the effort.',
        options: [
          { text: 'Advise the partner to find a buyer who does not ask for traceability, to avoid the cost.', correct: false, feedback: 'Due-diligence expectations under rules like CSDDD are spreading across the market, not disappearing. Chasing buyers who ask no questions is a shrinking, lower-value strategy and leaves the partner exposed.' },
          { text: 'Explain that traceability and due diligence are becoming the price of market access under EUDR-style origin rules and CSDDD human-rights due diligence, and use the existing tools — farmer IDs, plot mapping, group records, and Solichain — to build the data once and reuse it. Frame it as protecting access and commanding credible claims.', correct: true, feedback: 'Correct. Traceability and decent-work data are increasingly mandatory for European buyers, and ECA already has the digital backbone to provide them. Building credible data protects market access and supports a premium rather than being pure cost.' },
          { text: 'Tell the partner to send the buyer a general sustainability statement without underlying data.', correct: false, feedback: 'Unsupported statements do not satisfy due-diligence requirements and can amount to greenwashing. Buyers under CSDDD need verifiable origin and labour data, not assurances — credible claims rest on real records.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'Within Solidaridad ECA, cotton sits inside which sector?', options: ['Agriculture (food crops)', 'Mining', 'Fashion (cotton, leather, textiles)', 'Energy'], answer: 2 },
    { q: 'Which two ECA countries are the focus for cotton and the wider fashion value chain?', options: ['Kenya and Tanzania', 'Ethiopia and Uganda', 'Rwanda and Burundi', 'Kenya and Uganda'], answer: 1 },
    { q: 'Compared with most crops, cotton is best described as:', options: ['Very low input', 'One of the most pesticide-intensive crops', 'Grown entirely without irrigation', 'Free of labour concerns'], answer: 1 },
    { q: 'Integrated Pest Management means:', options: ['Spraying on a fixed weekly calendar', 'Using only chemical control', 'Combining cultural, biological, mechanical and — only as a last resort — chemical control, guided by scouting and thresholds', 'Never controlling pests at all'], answer: 2 },
    { q: 'Before spraying an insecticide on cotton, a field officer should first:', options: ['Spray immediately to be safe', 'Scout the field, identify the pest, and check damage against an economic threshold', 'Double the usual dose', 'Apply a banned but cheaper product'], answer: 1 },
    { q: 'Under the Better Cotton system, the most hazardous pesticides are:', options: ['Encouraged for fast results', 'Banned, with all pesticide use to be progressively reduced and handled safely', 'Allowed without restriction', 'Required for licensing'], answer: 1 },
    { q: 'Decent work in the Better Cotton standard is:', options: ['An optional extra for advanced farmers', 'A core principle — including no child labour and no forced labour', 'Only relevant in factories, not on farms', 'Not part of the standard'], answer: 1 },
    { q: 'The Better Cotton chain of custody is based on:', options: ['Full physical traceability of every fibre', 'Mass balance — matching sourced volume to grown volume while physical fibre may be blended', 'No tracking at all', 'Genetic fingerprinting of lint'], answer: 1 },
    { q: 'Mass balance guarantees that:', options: ['A specific garment contains the exact physical Better Cotton fibre grown by a named group', 'Demand pulls an equivalent volume of more sustainable cotton into the chain, rewarding growers', 'Cotton is never blended', 'Brands physically separate every bale'], answer: 1 },
    { q: 'The most damaging common contaminant of cotton lint is:', options: ['Water', 'Polypropylene from woven plastic sacks and twine', 'Cotton seed', 'Clean cotton bags'], answer: 1 },
    { q: 'To prevent contamination during picking and transport, farmers should use:', options: ['Woven polypropylene sacks and plastic twine', 'Cotton picking bags and natural twine', 'Any sack available', 'Jute and leather containers'], answer: 1 },
    { q: 'Which fibre property most directly increases the value of lint for spinning?', options: ['Higher trash content', 'Longer staple length', 'More contamination', 'Mixed varieties'], answer: 1 },
    { q: 'A responsible gin should:', options: ['Run as aggressively as possible to maximise throughput', 'Keep varieties and grades separate, set correctly for moisture and trash, and keep batch records', 'Mix all varieties and grades to save time', 'Ignore worker safety to cut costs'], answer: 1 },
    { q: 'The correct order of the cotton-to-garment chain is:', options: ['Spinning, ginning, garment, fabric', 'Ginning, spinning, fabric, garment', 'Fabric, garment, ginning, spinning', 'Garment, fabric, spinning, ginning'], answer: 1 },
    { q: 'For ECA fashion partners, the practical reason to invest in farmer IDs, plot mapping, and Solichain traceability is mainly to:', options: ['Create paperwork for its own sake', 'Meet EUDR-style origin and CSDDD due-diligence requirements and protect market access', 'Replace the Better Cotton standard', 'Avoid paying workers'], answer: 1 },
  ],
});


COURSES.push({
  id: 'leather',
  title: 'Leather: Hides, Tanning & Responsible Sourcing',
  subtitle: 'From rawstock to finished leather, done responsibly',
  category: 'Commodities',
  icon: commodityIcon(leatherIcon),
  duration: '1 hr 15 min',
  description: 'A six-module working summary of Solidaridad ECA\'s approach to the leather value chain — from hides and skins at the farm and abattoir, through tanning and finishing, to environmental management, decent work, and responsible sourcing under EUDR and CSDDD. Built on Solidaridad ECA\'s Fashion (cotton, leather, textiles) programme framing and well-established sector good practice. Designed for staff who support producers, cooperatives, tanneries, and processors — primarily in Ethiopia, and in Uganda.',
  lessons: [
    {
      id: 'leather-overview',
      title: 'Module 1 — Leather & Solidaridad ECA\'s Fashion Work',
      content: [
        { type: 'p', text: 'Leather sits inside Solidaridad ECA\'s Fashion sector alongside cotton and textiles. It is one of the few commodities where the same animal feeds two value chains at once — meat and dairy on one side, hides and skins on the other. This course is Solidaridad ECA\'s own curriculum framing for that chain: it draws on how ECA describes its Fashion work and on well-established good practice across the leather sector. There is no single source training manual behind it.' },
        { type: 'h', text: 'Where leather sits in ECA' },
        { type: 'p', text: 'In ECA, Solidaridad works across three sectors: agriculture, industry (fashion: cotton, leather, textiles), and mining. Leather is part of the Fashion portfolio, with Ethiopia as the primary leather country and Uganda also producing hides and leather. Ethiopia has one of Africa\'s largest livestock populations, a long-established tanning industry, and a national ambition to move from exporting raw or semi-processed hides toward finished leather, footwear, and leather goods.' },
        { type: 'callout', text: 'This is Solidaridad ECA\'s curriculum framing, not a vendor manual. Treat the figures as qualitative guidance and confirm country-specific numbers with the Fashion programme team before quoting them externally.' },
        { type: 'h', text: 'Why leather matters' },
        { type: 'list', items: [
          'Income from a by-product — hides and skins turn meat and dairy slaughter into a second revenue stream for farmers, traders, and abattoirs',
          'Industrial value addition — tanning, finishing, footwear, and leather goods create jobs, especially for women and youth',
          'Export earnings — finished leather and leather products earn far more than raw or wet-blue exports',
          'A circular logic — leather makes use of a material that would otherwise be waste from the meat and dairy chains',
        ]},
        { type: 'h', text: 'The leather process chain' },
        { type: 'p', text: 'Leather is made along a chain of distinct steps, each adding value and each capable of destroying it. Understanding the whole chain is the foundation of the rest of this course:' },
        { type: 'pathway', title: 'RAW HIDE / SKIN', text: 'Removed at slaughter. \'Hides\' come from large animals (cattle); \'skins\' from small animals (sheep, goats). Quality is largely fixed before this point, by husbandry and flaying.' },
        { type: 'pathway', title: 'CURING & PRESERVATION', text: 'The raw hide starts to rot within hours. Salting, drying, or chilling preserves it until it reaches the tannery. Poor curing is a major source of value loss.' },
        { type: 'pathway', title: 'TANNING', text: 'Converts a perishable hide into stable, rot-resistant leather. Mostly chrome tanning (fast, versatile) or vegetable tanning (slower, plant-based). Produces \'wet blue\' or \'wet white\' leather.' },
        { type: 'pathway', title: 'CRUSTING & FINISHING', text: 'Crusting dries, re-tans, dyes, and softens the leather; finishing applies surface coatings, colour, and texture for the final article. This is where most market value is added.' },
        { type: 'h', text: 'The value-loss problem' },
        { type: 'p', text: 'The central opportunity in the leather chain is that a large share of potential hide value is lost to preventable defects before tanning even begins — through poor animal husbandry, careless flaying, and bad curing. By the time a hide reaches the tannery, much of its grade is already decided.' },
        { type: 'stat', number: 'Wet blue', label: 'Where most ECA value currently stops', detail: 'Semi-processed chrome-tanned leather, exported with limited value addition' },
        { type: 'stat', number: 'Finished', label: 'Where the value case points', detail: 'Finished leather, footwear, and leather goods capture far higher margins and create more jobs' },
        { type: 'callout', text: 'Upgrading is the whole strategy: move value addition up the chain into the country, while protecting hide quality at the source and managing the environmental footprint of tanning.' },
        { type: 'h', text: 'The sustainability case' },
        { type: 'p', text: 'Leather carries real environmental and social risks — tannery effluent and chromium, water use, solid waste, worker chemical exposure, and the link between cattle and deforestation under EUDR. Done responsibly, it also delivers income, decent jobs, and a productive use for a by-product. Solidaridad\'s role is to help the chain capture the value while managing the risk.' },
        { type: 'highlight', text: 'Leather is value waiting to be saved. Most of it is lost before tanning — and most of that loss is preventable.' },
      ],
    },
    {
      id: 'leather-hides-quality',
      title: 'Module 2 — Hides & Skins Quality at the Source',
      content: [
        { type: 'p', text: 'Hide quality is decided long before the tannery. The single most important message for field staff is that the grade of a hide is set on the live animal and at slaughter — not in the tannery, which can only preserve quality, never create it. Most defects that downgrade a hide are preventable at almost no cost.' },
        { type: 'h', text: 'Defects on the live animal' },
        { type: 'p', text: 'Many of the worst defects are inflicted while the animal is alive, and they are permanent — the damaged grain layer cannot be repaired:' },
        { type: 'list', items: [
          'Branding — hot-iron brands burn through the most valuable part of the hide; brand on the cheek, leg, or hoof rather than the flank, or use ear tags',
          'Ectoparasites — ticks, mange, and lice scar the grain; cockle from external parasites is a leading cause of downgrading in sheep and goat skins',
          'Scratches and thorn damage — from poor fencing, thorny browse, and rough handling',
          'Dung and dirt — caked manure and poor hygiene weaken and stain the hide',
          'Disease and poor nutrition — produce thin, weak, uneven hides',
        ]},
        { type: 'callout', text: 'Branding on the flank is one of the most destructive and most common defects. It ruins the prime cutting area of the hide for the sake of a few seconds\' convenience.' },
        { type: 'h', text: 'Defects at slaughter — flaying' },
        { type: 'p', text: 'Flaying is removing the hide from the carcass. It is fast, skilled work, and the most common point where good hides are destroyed:' },
        { type: 'pathway', title: 'FLAY CUTS & SCORES', text: 'Knife cuts that slice into or through the hide. Caused by rushing, blunt knives, and pulling the knife rather than using fist-and-air separation. Each cut is a permanent hole or weak point.' },
        { type: 'pathway', title: 'POOR PATTERN & GADGETS', text: 'Ripping lines that wander, leaving meat (fleshing) on the hide or holes in it. Proper ripping lines and minimal knife work protect the hide shape and grade.' },
        { type: 'pathway', title: 'CONTAMINATION', text: 'Hides laid on bare ground pick up dirt, dung, and bacteria that start putrefaction. Flay onto a clean surface and keep the hide off the floor.' },
        { type: 'h', text: 'Curing and preservation' },
        { type: 'p', text: 'A raw hide is mostly water and protein — it begins to putrefy within hours of slaughter, especially in heat. Curing buys the time needed to reach a tannery. The aim is to remove or bind water and stop bacterial action:' },
        { type: 'value', title: 'WET SALTING', text: 'Pack the flesh side with clean salt; stack hides to drain. The most reliable method for cattle hides. Uses plenty of clean salt and good drainage. Re-salt if storage is prolonged.' },
        { type: 'value', title: 'SUSPENSION / FRAME DRYING', text: 'Dry skins on frames in shade with good airflow. Common for sheep and goat skins. Drying in direct sun or on the ground causes cracking, case-hardening, and putrefaction.' },
        { type: 'value', title: 'CHILLING', text: 'Where a cold chain exists, chilling slows decay without salt and avoids the salinity load on effluent later. Best suited to organised abattoirs near tanneries.' },
        { type: 'callout', text: 'Two curing mistakes dominate: too little salt (or dirty salt), and ground/sun drying. Both let putrefaction set in, and a putrefied hide cannot be saved by any tannery.' },
        { type: 'h', text: 'Grading and the role of the collector' },
        { type: 'p', text: 'Hides are graded on size, substance, and freedom from defects. Field staff supporting collectors, traders, and abattoirs should reinforce a simple chain of discipline: handle clean, flay carefully, cure promptly and properly, store off the ground, and move hides to the tannery as quickly as the cure allows.' },
        { type: 'highlight', text: 'The tannery can only preserve the quality it receives. Husbandry, flaying, and curing decide the grade — and all three are improved with training, not capital.' },
      ],
    },
    {
      id: 'leather-tanning',
      title: 'Module 3 — The Process Chain & Tanning',
      content: [
        { type: 'p', text: 'Tanning is the chemical heart of the leather chain — the step that turns a perishable hide into a durable, rot-resistant material. To support tanneries and processors, staff need a working picture of the full sequence and of the central choice between chrome and vegetable tanning.' },
        { type: 'h', text: 'Beamhouse — preparing the hide' },
        { type: 'p', text: 'Before tanning, the cured hide is cleaned and conditioned in the \'beamhouse\'. These wet operations consume the most water and generate much of the pollution load:' },
        { type: 'list', items: [
          'Soaking — rehydrates the cured hide and washes out salt and dirt',
          'Liming and unhairing — removes hair and epidermis using lime and sulphide; a major source of sulphide and high-pH effluent',
          'Fleshing — removes residual flesh and fat mechanically from the underside',
          'Deliming and bating — lowers pH and uses enzymes to soften the hide ready for tanning',
          'Pickling — acidifies the hide so tanning agents can penetrate',
        ]},
        { type: 'callout', text: 'Sulphide from unhairing is acutely dangerous: mixing sulphide liquors with acid releases toxic hydrogen sulphide gas, which has killed tannery workers. Beamhouse streams must be kept separate and never acidified in confined spaces.' },
        { type: 'h', text: 'The tanning choice' },
        { type: 'pathway', title: 'CHROME TANNING', text: 'Uses chromium (III) salts. Fast (often under a day), versatile, and produces soft, heat-resistant leather suited to footwear, upholstery, and garments. Output is pale blue \'wet blue\'. Dominates global and ECA production. Key risk: chromium in effluent and sludge, which must be recovered and managed.' },
        { type: 'pathway', title: 'VEGETABLE TANNING', text: 'Uses tannins from bark, wood, and leaves (mimosa, quebracho, wattle). Slow (days to weeks), produces firm, full-bodied leather for soles, belts, and saddlery. No chromium, but a high organic load in effluent. Often marketed as a lower-chemical alternative.' },
        { type: 'h', text: 'Chrome versus vegetable — the honest comparison' },
        { type: 'p', text: 'Neither tannage is simply \'clean\' or \'dirty\'. Each shifts the environmental burden:' },
        { type: 'list', items: [
          'Chrome: fast, cheap, versatile; concern is chromium in wastewater and sludge — manageable with recovery and good treatment',
          'Vegetable: chromium-free and renewable tannins; but slower, more water- and energy-intensive per hide, with a high organic pollution load',
          'Chrome (III) used in tanning is not the toxic chrome (VI); the real risk is uncontrolled discharge and the formation of chrome (VI) under poor storage and finishing conditions',
          'Match tannage to product: chrome for soft footwear and garment leather, vegetable for soles, belts, and traditional articles',
        ]},
        { type: 'h', text: 'Post-tanning — where value is built' },
        { type: 'value', title: 'CRUSTING', text: 'Samming and drying remove water; re-tanning, dyeing, and fatliquoring set the colour, fullness, and softness. The leather is dried to \'crust\' — a stable, undyed-to-coloured intermediate that can be stored or traded.' },
        { type: 'value', title: 'FINISHING', text: 'Surface coatings, pigments, embossing, and topcoats give the final colour, feel, gloss, and performance. Finishing decides whether leather meets a footwear or leather-goods buyer\'s specification — and is where the highest value is added.' },
        { type: 'value', title: 'WET BLUE vs FINISHED', text: 'Exporting wet blue captures a fraction of the value; finishing in-country captures the margin and the jobs. Moving from wet blue to finished leather and articles is the core of ECA\'s upgrading ambition.' },
        { type: 'callout', text: 'Every step after tanning multiplies value — and a defect carried through (a flay cut, a stain) is multiplied with it. Quality control must run the whole chain, not just the final inspection.' },
        { type: 'highlight', text: 'Tanning stabilises the hide; finishing makes the money. The further finishing happens inside the country, the more value and jobs ECA keeps.' },
      ],
    },
    {
      id: 'leather-environment',
      title: 'Module 4 — Environmental Management',
      content: [
        { type: 'p', text: 'Tanning is water-, chemical-, and energy-intensive, and untreated tannery effluent is one of the most damaging industrial discharges there is. Responsible environmental management is not optional for ECA\'s leather work — it is the licence to operate and the basis of access to responsible buyers.' },
        { type: 'h', text: 'The effluent challenge' },
        { type: 'p', text: 'A tannery turns most of its water into wastewater carrying a heavy and varied pollution load. The main streams are:' },
        { type: 'list', items: [
          'High organic load (BOD/COD) from soaking, liming, fleshing, and vegetable tanning',
          'Sulphides and high pH from unhairing and liming',
          'Salinity (chlorides) from cured hides and pickling',
          'Chromium from chrome tanning, in both effluent and sludge',
          'Suspended solids, fats, and nitrogen compounds',
        ]},
        { type: 'callout', text: 'Discharging untreated tannery effluent to rivers or fields contaminates drinking water and farmland and is illegal in most jurisdictions. Chromium and sulphide are the headline hazards, but the sheer organic and salt load is damaging on its own.' },
        { type: 'h', text: 'Managing the load — the hierarchy' },
        { type: 'pathway', title: 'REDUCE AT SOURCE', text: 'The cheapest pollution is the kind never created. Water-efficient processes, batch washing, hair-save unhairing (recovering hair instead of dissolving it), and good housekeeping cut load before any treatment is needed.' },
        { type: 'pathway', title: 'RECOVER & REUSE', text: 'Chrome recovery and recycling returns chromium to the tanning bath instead of the river. Spent liquors, salt, and water can be partly reused, lowering both cost and discharge.' },
        { type: 'pathway', title: 'TREAT', text: 'Effluent treatment plants combine physical (screening, settling), chemical (sulphide oxidation, chrome precipitation, pH correction), and biological treatment. Common effluent treatment plants (CETPs) let clustered tanneries share treatment infrastructure.' },
        { type: 'h', text: 'Chromium specifically' },
        { type: 'p', text: 'Chromium needs deliberate, separate management at every stage:' },
        { type: 'list', items: [
          'Precipitate and recover chromium from spent tanning liquors rather than discharging it',
          'Handle and store chrome sludge as hazardous waste — never spread it on land or dump it',
          'Prevent the formation of chrome (VI), which is toxic and carcinogenic, by controlling heat, storage, and finishing chemistry',
          'Monitor chromium in final discharge against the legal limit',
        ]},
        { type: 'h', text: 'Solid waste and by-products' },
        { type: 'p', text: 'A large fraction of every raw hide never becomes leather — it leaves as trimmings, fleshings, hair, shavings, and sludge. Good practice turns waste into by-products:' },
        { type: 'list', items: [
          'Fleshings and trimmings into gelatine, glue, tallow, or biogas feedstock',
          'Hair recovered (rather than dissolved) for protein products or compost',
          'Chrome shavings and buffing dust managed as hazardous waste or reprocessed where facilities exist',
          'Sludge dewatered and disposed of in lined, controlled sites',
        ]},
        { type: 'callout', text: 'Salinity is the quiet problem. High chloride from salting is hard to treat and damages soil and water even when chromium and sulphide are controlled — a strong argument for chilling and reduced-salt curing where feasible.' },
        { type: 'highlight', text: 'No tannery earns a place in a responsible supply chain without managing effluent, chromium, and solid waste. Reduce at source first, recover second, treat last.' },
      ],
    },
    {
      id: 'leather-decent-work',
      title: 'Module 5 — Decent Work, OHS & Chemical Safety',
      content: [
        { type: 'p', text: 'Tanneries and slaughter operations are among the more hazardous workplaces in any industrial sector — wet floors, sharp tools, heavy machinery, and a long list of chemicals. Decent work is a core part of Solidaridad ECA\'s mandate, and in leather it is inseparable from occupational health and safety.' },
        { type: 'h', text: 'The decent work foundation' },
        { type: 'p', text: 'Decent work in the leather chain rests on the ILO core labour standards — the floor below which no responsible workplace should fall:' },
        { type: 'list', items: [
          'No child labour — a real risk in informal flaying, collection, and small tanneries',
          'No forced labour',
          'Freedom of association and collective bargaining',
          'No discrimination — including equal treatment for the many women working in finishing and leather goods',
          'Decent wages, regular contracts, and reasonable working hours',
        ]},
        { type: 'h', text: 'Physical hazards in the tannery' },
        { type: 'pathway', title: 'SLIPS, MACHINES & CUTS', text: 'Wet, chemical-slick floors cause falls; drums, presses, splitting and shaving machines cause crush and amputation injuries; knives cause cuts. Guarding, drainage, footwear, and machine training are the defences.' },
        { type: 'pathway', title: 'CONFINED SPACES & GAS', text: 'Pits, tanks, and effluent channels can hold toxic or oxygen-deficient atmospheres. Hydrogen sulphide from sulphide liquors is an acute, sometimes fatal, hazard. Confined-space entry needs procedures, testing, and rescue plans.' },
        { type: 'pathway', title: 'NOISE, HEAT & LOAD', text: 'Drumming and machinery are loud; drying and finishing areas are hot; hides are heavy. Hearing protection, ventilation, and manual-handling practices all matter.' },
        { type: 'h', text: 'Chemical safety' },
        { type: 'p', text: 'Workers handle lime, sulphides, acids, chromium salts, solvents, dyes, and finishing chemicals daily. Chemical management is the heart of OHS in a tannery:' },
        { type: 'list', items: [
          'Maintain safety data sheets and an inventory for every chemical on site',
          'Provide and enforce PPE — gloves, aprons, boots, eye protection, and respirators where needed',
          'Never mix incompatible chemicals; keep sulphide and acid streams apart to avoid hydrogen sulphide gas',
          'Store chemicals labelled, segregated, and away from food and drinking water',
          'Provide washing facilities, training, and first aid; control dust from buffing and dry finishing',
        ]},
        { type: 'callout', text: 'The deadliest single mistake in a tannery is mixing sulphide liquor with acid in or near a confined space, releasing hydrogen sulphide. It can incapacitate in seconds. Treat every pit and tank as potentially lethal until tested.' },
        { type: 'h', text: 'Health surveillance and informal work' },
        { type: 'p', text: 'Chronic exposure to chromium, solvents, and dust causes skin disease (chrome ulcers, dermatitis), respiratory illness, and other long-term harm. Responsible operations provide health checks and reduce exposure at source. Much hide handling and small-scale tanning is informal, where protections are weakest — a priority area for ECA support.' },
        { type: 'highlight', text: 'Leather is made by people, often in hazardous conditions. Decent work and chemical safety are not add-ons to the sustainability case — they are the heart of it.' },
      ],
    },
    {
      id: 'leather-sourcing',
      title: 'Module 6 — Responsible Sourcing, LWG, Traceability & Upgrading',
      content: [
        { type: 'p', text: 'The final module joins the chain to the market. Responsible buyers increasingly require proof that leather is made cleanly, fairly, and without driving deforestation. For ECA, meeting those requirements is both a compliance task and the lever for moving up the value chain.' },
        { type: 'h', text: 'The Leather Working Group (LWG)' },
        { type: 'p', text: 'The Leather Working Group is the leading environmental certification and audit body for leather manufacturing. Its protocol audits tanneries and rates them (commonly bronze, silver, gold) on environmental performance:' },
        { type: 'list', items: [
          'Water and energy use per unit of production',
          'Effluent treatment and chemical management, including chromium',
          'Air and waste management',
          'Traceability of incoming hides and chemical inputs',
          'Restricted substances and operating permits',
        ]},
        { type: 'pathway', title: 'WHY LWG MATTERS', text: 'Major footwear and fashion brands increasingly buy only from LWG-rated tanneries. An ECA tannery without a credible environmental rating is locked out of the buyers that pay the most and demand the most.' },
        { type: 'pathway', title: 'TRACEABILITY OF HIDES', text: 'LWG and brands want to know where hides came from. Traceability back to the abattoir — and ideally the farm — is becoming a condition of sale, and overlaps directly with EUDR.' },
        { type: 'h', text: 'EUDR and CSDDD' },
        { type: 'p', text: 'Two EU regulations bear directly on leather, because leather derives from cattle:' },
        { type: 'value', title: 'EUDR', text: 'The EU Deforestation Regulation covers cattle — and therefore beef and leather products. Leather entering the EU must be traceable to land that was not deforested after the cutoff, with geolocation of the source. Dairy and beef chains where culled animals enter the leather stream are directly affected.' },
        { type: 'value', title: 'CSDDD', text: 'The Corporate Sustainability Due Diligence Directive requires large companies to identify and address environmental and human-rights harms in their supply chains. For leather that means tannery effluent, chromium, child labour, and worker safety become buyer-level due-diligence obligations.' },
        { type: 'callout', text: 'For most smallholder and dairy farmers, point-location geolocation of the source animal may suffice under EUDR, but the data must exist and flow up the chain. Without farm and abattoir data, the tannery cannot prove compliance and the buyer cannot purchase.' },
        { type: 'h', text: 'Solidaridad\'s tools and role' },
        { type: 'list', items: [
          'Solichain — Solidaridad\'s blockchain traceability platform — can capture hide origin, movement, and certification data and produce audit-ready records aligned with EUDR',
          'Integrated Supply Chain Transformation — ECA\'s country-specific strategy aligning fashion (cotton, leather, textiles) with EUDR and CSDDD end to end',
          'Buyer partnerships and trade fairs connect upgraded producers to responsible markets',
          'Training and cooperative strengthening at the source protect hide quality and decent work',
        ]},
        { type: 'h', text: 'Value-chain upgrading' },
        { type: 'p', text: 'The strategic destination for ECA\'s leather work — Ethiopia especially — is upgrading: capturing more value inside the country by moving from raw and wet-blue exports toward finished leather, footwear, and leather goods, while raising environmental and labour standards in step:' },
        { type: 'list', items: [
          'Protect hide quality at the source so tanneries have grade to work with',
          'Modernise tanning and add finishing capacity in-country',
          'Build footwear and leather-goods manufacturing — labour-intensive and youth- and women-friendly',
          'Meet LWG, EUDR, and CSDDD requirements as the entry ticket to premium buyers',
        ]},
        { type: 'highlight', text: 'Responsible sourcing is not a barrier to ECA\'s leather ambition — it is the path to it. Clean tanning, decent work, and traceability are exactly what the highest-value buyers demand.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Leather Value-Chain Scenarios',
    scenarios: [
      {
        situation: 'A pastoralist cooperative you support brands its cattle with a hot iron on the flank for ownership identification. They are proud of the practice and say buyers have never complained about the meat.',
        options: [
          { text: 'Leave it alone — branding is a livestock matter, not a leather concern.', correct: false, feedback: 'Flank branding is one of the most destructive and common hide defects. It permanently ruins the prime cutting area of the hide, and the loss falls on the leather value the household could have earned.' },
          { text: 'Explain that flank branding burns through the most valuable part of the hide, and propose alternatives — branding on the cheek, leg, or hoof, or ear tags — that preserve both ownership identification and hide value.', correct: true, feedback: 'Correct. The defect is permanent and avoidable. Moving the brand off the flank, or switching to ear tags, protects the hide grade at no real cost to the farmer and is one of the highest-leverage messages in source training.' },
          { text: 'Tell them to stop branding entirely and rely on community trust.', correct: false, feedback: 'Identification matters to pastoralists and removing it outright is impractical. The point is not to abolish branding but to move it off the valuable flank or replace it with tags.' },
        ],
      },
      {
        situation: 'A rural abattoir flays carcasses quickly with whatever knife is to hand and lays the hides on the bare ground until a collector arrives, sometimes the next day, in hot weather.',
        options: [
          { text: 'Recommend they sun-dry the hides on the ground to stop them rotting before the collector comes.', correct: false, feedback: 'Ground drying and sun drying both cause contamination, cracking, and case-hardening. Laying hides on bare ground is itself a source of dung, dirt, and bacteria that start putrefaction.' },
          { text: 'Address flaying and curing together: sharp knives and careful pattern to avoid flay cuts, flay onto a clean surface off the ground, then promptly wet-salt the hides with clean salt and stack to drain until collection.', correct: true, feedback: 'Correct. Flay cuts and ground contamination are major preventable defects, and a raw hide putrefies within hours in heat. Careful flaying plus prompt, proper wet salting protects the grade until the hide reaches the tannery.' },
          { text: 'Tell them hide quality is the tannery\'s problem and they should focus on the meat.', correct: false, feedback: 'The tannery can only preserve the quality it receives — it cannot recover a hide ruined by flay cuts or putrefaction. The grade is decided at the abattoir, so this is exactly their problem.' },
        ],
      },
      {
        situation: 'A tannery manager asks you whether they should switch from chrome to vegetable tanning so they can market their footwear leather as chrome-free and \'environmentally clean\'.',
        options: [
          { text: 'Endorse the switch unconditionally — vegetable tanning is clean and chrome is dirty.', correct: false, feedback: 'This oversimplifies. Vegetable tanning is chromium-free but slower and more water- and energy-intensive, with a high organic effluent load. It also produces firmer leather not ideal for soft footwear. Neither tannage is simply clean or dirty.' },
          { text: 'Walk through the trade-offs: vegetable tanning avoids chromium but shifts the burden to organic load, water, and energy and suits firmer articles; chrome remains best for soft footwear and is manageable with chrome recovery and good effluent treatment. Match tannage to product and improve effluent management either way.', correct: true, feedback: 'Correct. The honest comparison shifts the burden rather than removing it. For soft footwear, well-managed chrome with recovery is often the better fit; the real win is effluent and chromium management, not the label.' },
          { text: 'Tell them tannage choice does not affect the environment, only the effluent plant does.', correct: false, feedback: 'Tannage choice strongly shapes the pollution profile — chromium versus high organic load, water and energy use, and product fit. It is a genuine environmental decision, not a neutral one.' },
        ],
      },
      {
        situation: 'During a site visit you notice tannery workers about to pour acid into a pit that still holds spent sulphide liquor from unhairing, to \'neutralise\' it before discharge. The pit is partly enclosed.',
        options: [
          { text: 'Let them proceed — neutralising before discharge is good environmental practice.', correct: false, feedback: 'Mixing sulphide liquor with acid releases hydrogen sulphide, a toxic gas that can incapacitate and kill in seconds, especially in a partly enclosed pit. This is one of the deadliest mistakes possible in a tannery.' },
          { text: 'Stop the work immediately, explain the hydrogen sulphide hazard, and insist sulphide and acid streams be kept separate with proper sulphide oxidation, ventilation, gas testing, and confined-space procedures before any such operation.', correct: true, feedback: 'Correct. This is a life-safety stop-work situation. Sulphide and acid must never be combined in or near a confined space. Sulphide streams need dedicated oxidation and the area needs testing and ventilation.' },
          { text: 'Suggest they wear dust masks and continue.', correct: false, feedback: 'Ordinary dust masks offer no protection against hydrogen sulphide gas. The hazard must be eliminated by separating the streams and following confined-space procedures, not mitigated with the wrong PPE.' },
        ],
      },
      {
        situation: 'A footwear brand tells an Ethiopian tannery in your programme that it will only continue buying if the tannery becomes LWG-rated and can trace its hides. The tannery says this is an unfair barrier designed to keep them out.',
        options: [
          { text: 'Agree it is a barrier and advise them to find buyers with no environmental requirements.', correct: false, feedback: 'Steering them toward unconditional buyers locks them into the lowest-value end of the market. LWG rating and traceability are becoming the entry ticket to the buyers that pay most — avoiding them forecloses the upgrading path.' },
          { text: 'Reframe it as the path to higher-value markets: help them pursue LWG audit readiness (effluent, chromium, chemical management, traceability) and build hide traceability back to the abattoir, which also serves EUDR. Use Solichain and ECA\'s integrated supply-chain support.', correct: true, feedback: 'Correct. Responsible sourcing requirements are the lever for upgrading, not a barrier. LWG readiness and traceability open the premium buyers and overlap directly with EUDR, so the investment serves several goals at once.' },
          { text: 'Tell them traceability is impossible for African hides so they should not try.', correct: false, feedback: 'Traceability back to the abattoir, and increasingly the farm, is achievable with tools like Solichain and is already a condition of sale for major brands. Declaring it impossible abandons the most valuable buyers.' },
        ],
      },
      {
        situation: 'A dairy cooperative asks why EUDR should concern them at all — they produce milk, not leather, and have never thought of themselves as part of a leather supply chain.',
        options: [
          { text: 'Reassure them EUDR is only about coffee and cocoa and does not touch dairy farmers.', correct: false, feedback: 'EUDR covers cattle, and therefore both beef and leather. Culled dairy animals enter the beef and leather streams, so dairy farms are part of the EUDR-relevant cattle chain whether or not they think of themselves that way.' },
          { text: 'Explain that EUDR covers cattle — so when their culled animals enter the beef and leather streams, the hides need traceability to non-deforested land. Their farm geolocation and production data feed the operators above them, and without it those buyers cannot purchase.', correct: true, feedback: 'Correct. Leather derives from cattle, so the dairy farm sits inside the EUDR cattle chain. Capturing geolocation and production data now positions them to keep market access as the hide and beef streams come under EUDR scrutiny.' },
          { text: 'Tell them to stop selling culled animals so EUDR never applies.', correct: false, feedback: 'Removing culled animals from the market destroys a legitimate income stream and is unnecessary. The right response is to capture the traceability data so the cattle chain stays compliant, not to abandon the chain.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'In leather terminology, \'hides\' come from large animals and \'skins\' from small animals. Which is a skin?', options: ['Cattle', 'Buffalo', 'Goat', 'Horse'], answer: 2 },
    { q: 'Where is most hide quality decided?', options: ['In the finishing department', 'On the live animal and at slaughter', 'During export grading', 'In the tannery beamhouse'], answer: 1 },
    { q: 'Why is hot-iron branding on the flank a serious problem for leather?', options: ['It makes the meat tougher', 'It permanently ruins the most valuable cutting area of the hide', 'It has no effect on the hide', 'It only affects the colour of the leather'], answer: 1 },
    { q: 'The most reliable curing method for cattle hides before they reach the tannery is:', options: ['Drying on the bare ground in the sun', 'Wet salting with clean salt and good drainage', 'Leaving them in a sealed plastic bag', 'No treatment if collected within two days'], answer: 1 },
    { q: 'The correct order of the leather process chain is:', options: ['Tanning → curing → finishing → raw hide', 'Raw hide → curing → tanning → crusting & finishing', 'Finishing → tanning → curing → raw hide', 'Curing → finishing → raw hide → tanning'], answer: 1 },
    { q: 'Chrome tanning is best characterised as:', options: ['Slow, plant-based, producing firm sole leather', 'Fast and versatile, producing soft leather, with chromium as the key effluent concern', 'Chromium-free with a high organic effluent load', 'Used only for traditional saddlery'], answer: 1 },
    { q: 'Vegetable tanning differs from chrome tanning mainly in that it:', options: ['Is faster and cheaper', 'Uses plant tannins, is chromium-free, but is slower with a high organic effluent load', 'Produces only soft footwear leather', 'Has no environmental impact at all'], answer: 1 },
    { q: 'Which tannery step adds the most market value to the leather?', options: ['Soaking', 'Liming', 'Crusting and finishing', 'Pickling'], answer: 2 },
    { q: 'Which gas hazard makes mixing sulphide liquor with acid potentially fatal in a tannery?', options: ['Carbon dioxide', 'Hydrogen sulphide', 'Oxygen', 'Methane'], answer: 1 },
    { q: 'The recommended order for managing tannery pollution is:', options: ['Treat first, then recover, then reduce', 'Reduce at source, then recover and reuse, then treat', 'Discharge, then monitor', 'Recover only; treatment is unnecessary'], answer: 1 },
    { q: 'How should chrome sludge from a tannery be handled?', options: ['Spread on farmland as fertiliser', 'Discharged with the main effluent', 'Managed as hazardous waste in controlled disposal', 'Dried and sold as building material'], answer: 2 },
    { q: 'The Leather Working Group (LWG) is best described as:', options: ['A trade union for tannery workers', 'The leading environmental audit and certification body for leather manufacturing', 'An EU customs authority', 'A breed registry for cattle'], answer: 1 },
    { q: 'Why does EUDR apply to leather?', options: ['Because leather is a forest product', 'Because leather derives from cattle, which EUDR covers', 'Because tanneries use timber', 'EUDR does not apply to leather'], answer: 1 },
    { q: 'For ECA, the strategic direction for the leather sector is to:', options: ['Maximise raw and wet-blue exports', 'Stop tanning altogether', 'Move value addition up the chain into finished leather, footwear, and goods while raising standards', 'Focus only on the meat, not the hide'], answer: 2 },
    { q: 'Which ILO concern is a particular risk in informal flaying, hide collection, and small tanneries?', options: ['Excessive automation', 'Child labour', 'Overproduction', 'Currency fluctuation'], answer: 1 },
  ],
});


COURSES.push({
  id: 'dairy',
  title: 'Dairy: Herd, Milk & Market',
  subtitle: 'Productive herds, clean milk and better markets',
  category: 'Commodities',
  icon: commodityIcon(dairyIcon),
  duration: '1 hr 10 min',
  description: 'A six-module working summary of Solidaridad East & Central Africa\'s smallholder dairy programme framing, combined with established good practice for dairy in East Africa. Designed for staff who support field teams, partner cooperatives, and milk-bulking hubs. Livestock (Dairy) is an active commodity in Ethiopia and Kenya, with the e-Dairy quality-based payment tool central to the digital strategy.',
  lessons: [
    {
      id: 'dairy-overview',
      title: 'Module 1 — Dairy & Solidaridad ECA\'s Dairy Work',
      content: [
        { type: 'p', text: 'Dairy is one of Solidaridad ECA\'s livestock commodities — a daily income source that puts cash in farmers\' hands more frequently than any seasonal crop. Listed in our country portfolio as Livestock (Dairy), it is an active commodity in Ethiopia and Kenya. This course is Solidaridad ECA\'s curriculum framing for staff: it draws on our own programme themes and on well-established good practice for smallholder dairy in East Africa.' },
        { type: 'callout', text: 'This module is Solidaridad ECA\'s curriculum framing, not a single source manual. Where exact figures are not certain, speak qualitatively in the field rather than quoting numbers you cannot stand behind.' },
        { type: 'h', text: 'Why dairy matters' },
        { type: 'list', items: [
          'Daily cash flow — milk is sold every day, smoothing household income between crop harvests',
          'Nutrition — milk delivers high-quality protein, calcium, and micronutrients to the household',
          'Asset and savings — a dairy cow is a store of wealth and a source of manure for crops',
          'Women\'s livelihood — women perform much of the day-to-day cow care, feeding, milking, and calf rearing',
          'Market linkage — bulked milk connects smallholders to processors, cooperatives, and formal buyers',
        ]},
        { type: 'h', text: 'The smallholder dairy case' },
        { type: 'p', text: 'Most ECA milk comes from smallholders keeping one to a few cows. The gap between what these animals produce and what they could produce is the entire opportunity. Improved or cross-bred cattle that are well fed and healthy can yield several times more milk than unimproved local cattle on poor feed. The constraints are rarely the animal alone — they are feed, health, breeding, and hygiene together.' },
        { type: 'stat', number: 'Several times', label: 'Yield potential of improved breeds', detail: 'Improved or cross-bred cows with good feeding and health can yield several times more milk than unimproved cattle on poor feed' },
        { type: 'stat', number: 'Up to ~60%', label: 'Share of cost that is feed', detail: 'Feed is typically the single largest cost in smallholder dairy — the biggest lever on profitability' },
        { type: 'callout', text: 'A high-yielding cow that is underfed, sick, or milked unhygienically loses money. The four levers — breeding, feed, health, and clean milk — must move together.' },
        { type: 'h', text: 'Solidaridad ECA\'s dairy work' },
        { type: 'p', text: 'Our dairy programming sits within the MASP framework: viable and resilient production systems, inclusive service delivery, fair market connection, and an enabling policy environment. For dairy this means strengthening cooperatives and bulking hubs, improving milk quality, linking farmers to quality-based payment, and building climate-smart, gender-responsive herds.' },
        { type: 'pathway', title: 'E-DAIRY', text: 'Solidaridad ECA\'s digital tool for quality-based milk payment. It records and grades milk so farmers are paid on quality, not just volume — and it can shift income visibility toward the women who do the daily milking.' },
        { type: 'pathway', title: 'COOPERATIVES & HUBS', text: 'Milk-bulking hubs and dairy cooperatives aggregate smallholder milk, provide cooling and services (AI, feed, vet, credit), and give farmers collective bargaining power with processors.' },
        { type: 'pathway', title: 'QUALITY-BASED PAYMENT', text: 'Paying farmers by measured quality rewards clean, un-adulterated, low-bacteria milk. It turns hygiene and the cold chain from a cost into an income.' },
        { type: 'pathway', title: 'CLIMATE-SMART DAIRY', text: 'Better feed efficiency lowers methane per litre; manure management and biogas turn waste into energy and fertiliser. Solar-powered milk chillers extend the cold chain off-grid.' },
        { type: 'highlight', text: 'Dairy is a daily-income commodity. Get herd, feed, health, and hygiene right together and income, nutrition, and resilience follow.' },
      ],
    },
    {
      id: 'dairy-herd',
      title: 'Module 2 — Herd Management, Breeds & Breeding',
      content: [
        { type: 'p', text: 'The cow is the production unit. Choosing the right type of animal for the system, and breeding it well, sets the ceiling on what feed and health can deliver. Get this wrong and even perfect feeding cannot rescue the yield.' },
        { type: 'h', text: 'Breed types' },
        { type: 'pathway', title: 'INDIGENOUS / LOCAL', text: 'Hardy, disease- and heat-tolerant, low feed needs, but low milk yield. Suited to harsh, low-input, pastoral systems where survival matters more than litres.' },
        { type: 'pathway', title: 'IMPROVED / EXOTIC', text: 'Breeds such as Friesian/Holstein, Ayrshire, Jersey, Guernsey. High milk yield, but high feed, water, and health demands. Struggle under heat stress and poor feeding.' },
        { type: 'pathway', title: 'CROSS-BREEDS', text: 'A cross of local and exotic. The mainstay of smallholder dairy in ECA — they balance higher yield with better hardiness and lower feed/health demands than pure exotics.' },
        { type: 'callout', text: 'Do not push pure exotic breeds onto a farm that cannot feed or cool them. A well-managed cross-breed almost always outperforms a starved Friesian. Match the breed to the feed and management the farmer can actually provide.' },
        { type: 'h', text: 'Breeding methods' },
        { type: 'pathway', title: 'ARTIFICIAL INSEMINATION (AI)', text: 'Semen from proven high-genetic-merit bulls, delivered by a trained technician. Faster genetic gain, no need to keep a bull, lower disease transmission. Depends on heat detection, technician access, and a working semen cold chain (liquid nitrogen).' },
        { type: 'pathway', title: 'NATURAL SERVICE (BULL)', text: 'A bull serves the cows directly. Simple and reliable where AI services are weak, but risks inbreeding, disease spread, and slow genetic progress, and the bull is a cost to keep.' },
        { type: 'h', text: 'Heat detection and breeding timing' },
        { type: 'list', items: [
          'Watch for signs of heat (oestrus): standing to be mounted, restlessness, clear mucus discharge, reduced feed intake',
          'Time AI correctly — service toward the latter part of standing heat for best conception',
          'Keep simple records of heat dates, service dates, and expected calving',
          'Aim for a calf roughly once a year — a long gap between calvings means lost milk',
        ]},
        { type: 'h', text: 'The production cycle and key groups' },
        { type: 'list', items: [
          'A cow must calve to give milk — milk follows calving, then declines through the lactation',
          'Dry period — give the cow a rest before her next calving so she milks well next lactation',
          'Calf rearing — good colostrum within hours of birth, then clean feeding, builds the next milking cow or sale animal',
          'Heifers — well-grown replacement heifers are the future herd; do not stunt them',
        ]},
        { type: 'h', text: 'Record-keeping' },
        { type: 'p', text: 'Simple records turn a guess into management: daily milk yield per cow, breeding and calving dates, feed given, and health/treatment events. Records let staff and farmers spot the cow that is not earning her keep and the practice that is paying off.' },
        { type: 'highlight', text: 'Breed for the system you can feed and manage. A fed and healthy cross-breed beats a starved exotic every time.' },
      ],
    },
    {
      id: 'dairy-feed',
      title: 'Module 3 — Feed & Fodder: The Biggest Lever',
      content: [
        { type: 'p', text: 'Feed is usually the single largest cost in smallholder dairy and the biggest determinant of milk yield. Most low-yield problems in the field are feed problems first. A cow only milks to the level her feed allows, regardless of her genetics.' },
        { type: 'stat', number: 'Up to ~60%', label: 'Of production cost is feed', detail: 'Feed is the largest input cost — so feed efficiency is where profitability is won or lost' },
        { type: 'h', text: 'What a dairy cow needs' },
        { type: 'p', text: 'A milking cow needs a balanced ration: energy and fibre from forage, protein, minerals, and clean water. Aim for a balanced ration, not just a full belly — poor-quality bulk fills the rumen without supporting milk.' },
        { type: 'pathway', title: 'FORAGE (THE BASE)', text: 'Napier (elephant) grass, Rhodes grass, and other fodder grasses are the cheap base of the ration. Cut at the right stage — too old and it is stemmy and low in protein.' },
        { type: 'pathway', title: 'PROTEIN (LEGUMES)', text: 'Fodder legumes such as desmodium, lucerne, and leucaena, plus dairy meal, raise the protein the rumen needs to convert forage into milk.' },
        { type: 'pathway', title: 'CONCENTRATES', text: 'Dairy meal and by-products give a high-yielding cow the extra energy and protein forage alone cannot. Feed to yield — more for the high producer, less for the low.' },
        { type: 'pathway', title: 'MINERALS & WATER', text: 'A mineral lick supplies calcium, phosphorus, and trace elements. Water is the cheapest input and the most limiting — a milking cow drinks a lot, and milk is mostly water.' },
        { type: 'callout', text: 'Clean water, freely available, is the most under-rated dairy input. A cow short of water cannot milk to her potential no matter how well she is fed.' },
        { type: 'h', text: 'Fodder conservation — feeding the dry season' },
        { type: 'p', text: 'Milk and feed both crash in the dry season. Conserving feed when it is abundant is how farmers keep cows milking year-round and avoid buying expensive feed at the worst time.' },
        { type: 'pathway', title: 'SILAGE', text: 'Forage (often maize or napier) chopped and packed airtight to ferment and preserve as moist feed. Stores high-quality feed for the dry season. Must be packed tightly and sealed against air to avoid spoilage.' },
        { type: 'pathway', title: 'HAY', text: 'Forage cut and dried, then baled and stored under cover. Simpler than silage; cut at the right stage and dry fully to avoid mould.' },
        { type: 'h', text: 'Feeding systems' },
        { type: 'list', items: [
          'Zero-grazing (cut-and-carry) — cow is kept in a unit and fed; saves land, controls feeding, collects manure, reduces tick exposure',
          'Semi-zero-grazing — part grazing, part supplemented feeding',
          'Open grazing — lowest cost but lowest control over nutrition and disease',
          'Feed to yield — match concentrate to each cow\'s milk output rather than feeding all cows the same',
        ]},
        { type: 'highlight', text: 'Feed is the biggest cost and the biggest lever. Conserve fodder for the dry season and feed a balanced ration to yield — that is most of the profit.' },
      ],
    },
    {
      id: 'dairy-health',
      title: 'Module 4 — Animal Health & Disease Management',
      content: [
        { type: 'p', text: 'A sick cow does not milk. Health management in ECA dairy is dominated by mastitis, tick-borne diseases including East Coast Fever, and the routine preventive work of vaccination and deworming. Prevention is far cheaper than treatment, and good husbandry prevents most disease.' },
        { type: 'h', text: 'Mastitis — the dairy farmer\'s biggest health loss' },
        { type: 'p', text: 'Mastitis is inflammation of the udder, usually from bacteria entering through the teat. It cuts yield, spoils milk, and can permanently damage a quarter of the udder. Much of it comes straight from poor milking hygiene.' },
        { type: 'list', items: [
          'Clinical mastitis — visible: clots or flakes in milk, hot/swollen/painful udder',
          'Sub-clinical mastitis — invisible, but raises somatic cell count and quietly cuts yield and quality',
          'Prevent with clean milking, dry teats, full milk-out, and clean dry bedding',
          'Use the strip cup and, where available, the California Mastitis Test to catch it early',
        ]},
        { type: 'callout', text: 'Milk from a cow under antibiotic treatment must be withheld for the full withdrawal period and never delivered to the hub. Antibiotic residues can ruin a whole bulk tank and breach food-safety rules.' },
        { type: 'h', text: 'Tick-borne diseases and East Coast Fever' },
        { type: 'p', text: 'Ticks transmit some of the most damaging cattle diseases in ECA. East Coast Fever (ECF), caused by a parasite spread by the brown ear tick, is a major killer of cattle in the region — exotic and cross-bred animals are especially vulnerable.' },
        { type: 'list', items: [
          'Control ticks through regular dipping or spraying with acaricides, applied correctly and consistently',
          'East Coast Fever can be prevented in many areas by immunisation (the infection-and-treatment method) where available',
          'Other tick-borne diseases include anaplasmosis, babesiosis (redwater), and heartwater',
          'Zero-grazing reduces tick exposure compared with open grazing',
        ]},
        { type: 'h', text: 'Routine preventive health' },
        { type: 'pathway', title: 'VACCINATION', text: 'Follow the local vaccination calendar for notifiable and common diseases (such as foot-and-mouth, lumpy skin disease, blackquarter, anthrax as locally advised). Vaccination is cheap insurance against catastrophic loss.' },
        { type: 'pathway', title: 'DEWORMING', text: 'Internal parasites quietly drain condition and milk. Deworm on a regular schedule and rotate products as advised to manage resistance.' },
        { type: 'pathway', title: 'TICK CONTROL', text: 'Consistent dipping or spraying with acaricides at the correct strength and interval. Skipping treatments lets tick-borne disease back in.' },
        { type: 'pathway', title: 'BIOSECURITY', text: 'Quarantine new or sick animals, keep housing clean and dry, and limit disease entry to the farm. Healthy herds start with what does not get in.' },
        { type: 'callout', text: 'Always work with qualified animal-health providers and follow withdrawal periods and dosages. Staff support farmers to access services and keep records — they do not diagnose or prescribe.' },
        { type: 'highlight', text: 'Prevention beats treatment. Control ticks and ECF, follow the vaccination and deworming calendar, and stop mastitis at the milking stool.' },
      ],
    },
    {
      id: 'dairy-clean-milk',
      title: 'Module 5 — Clean Milk Production, Hygiene & the Cold Chain',
      content: [
        { type: 'p', text: 'Milk leaves the udder almost sterile and clean. Almost everything that lowers its quality is added afterwards — by dirty hands, dirty equipment, delay, and heat. Clean milk production is a routine, not a one-off, and it is the gateway to quality-based payment.' },
        { type: 'h', text: 'The let-down reflex and the milking routine' },
        { type: 'p', text: 'Milk let-down is a reflex: gentle udder stimulation triggers a hormone (oxytocin) that releases milk, and the window lasts only a few minutes. A calm, consistent routine gets the milk out fast and fully; stress and rough handling hold it back.' },
        { type: 'list', items: [
          'Wash hands and the udder with clean water and dry with an individual cloth or paper',
          'Strip the first few squirts into a strip cup to check for mastitis and remove the most contaminated milk',
          'Milk quickly and gently within the let-down window, with full hand or correct machine technique',
          'Milk the cow out completely — residual milk invites mastitis and cuts the next yield',
          'Keep the same order, same person, and same time each day — cows let down to routine',
        ]},
        { type: 'h', text: 'Hygiene and equipment' },
        { type: 'list', items: [
          'Use clean, food-grade containers — aluminium or stainless steel, not plastic jerry cans that cannot be properly cleaned',
          'Wash equipment with clean hot water and detergent immediately after each milking, then air-dry',
          'Sick or treated cows last, with their milk kept separate and withheld through the withdrawal period',
          'Keep the milking area, bedding, and the cow\'s flanks and udder clean and dry',
        ]},
        { type: 'callout', text: 'NEVER ADULTERATE MILK. Adding water, or hydrogen peroxide and other preservatives to mask spoilage, is fraud, a food-safety hazard, and grounds for rejection at the hub. Quality-based payment is designed to catch it.' },
        { type: 'h', text: 'The cold chain' },
        { type: 'p', text: 'Milk is warm and full of nutrients — ideal for bacteria. Bacteria multiply fast at ambient temperature, so milk must move fast and cold from cow to chiller. The cold chain is the difference between accepted, high-grade milk and rejected, spoiled milk.' },
        { type: 'list', items: [
          'Deliver to the cooling point as soon as possible after milking — every hour warm raises the bacterial count',
          'Cool quickly to and hold around 4 degrees C in a chiller or cooler',
          'Solar-powered milk chillers extend the cold chain to off-grid collection points',
          'Keep milk shaded and covered in transit; never mix fresh warm milk into already-cooled milk',
        ]},
        { type: 'h', text: 'Quality tests at the hub' },
        { type: 'list', items: [
          'Organoleptic checks — smell, appearance, taste for off-milk',
          'Alcohol/clot-on-boiling test — screens for spoiled or unstable milk',
          'Lactometer / density — screens for added water',
          'Somatic cell count and bacterial count — measure udder health and hygiene; high counts mean lower grade or rejection',
        ]},
        { type: 'highlight', text: 'Milk is clean at the udder. Keep it clean, keep it cold, never adulterate it — and quality-based payment turns that discipline into income.' },
      ],
    },
    {
      id: 'dairy-market',
      title: 'Module 6 — Quality-Based Payment, Cooperatives, Climate-Smart Dairy & Gender',
      content: [
        { type: 'p', text: 'The final module connects the cow to the market and to the bigger picture: how farmers get paid for quality, how cooperatives and hubs give them power, how dairy can be made climate-smart, and how gender shapes who does the work and who gets the income.' },
        { type: 'h', text: 'Quality-based milk payment' },
        { type: 'p', text: 'Paying purely by volume rewards quantity, including watered-down or spoiled milk. Quality-based payment grades milk on measured quality — hygiene, density, fat/solids, bacterial and somatic cell counts — and pays accordingly. It rewards the farmers doing the right thing and penalises adulteration.' },
        { type: 'pathway', title: 'E-DAIRY', text: 'Solidaridad ECA\'s digital quality-based payment tool. It records deliveries, grades milk, and calculates payment by quality, making the link between clean milk and money visible to every farmer.' },
        { type: 'pathway', title: 'THE INCENTIVE LOOP', text: 'When clean, cold, un-adulterated milk earns more, hygiene and the cold chain stop being a cost and become an income. Quality-based payment is how good practice pays for itself.' },
        { type: 'h', text: 'Cooperatives and bulking hubs' },
        { type: 'p', text: 'Individually, a smallholder with a few litres has no market power. Aggregated through a cooperative or milk-bulking hub, that same milk reaches processors at scale, with cooling, testing, and services attached.' },
        { type: 'list', items: [
          'Bulking and cooling — hubs aggregate and chill milk so it meets processor standards',
          'Services — many hubs bundle AI, vet, feed, and credit (check-off against milk payment)',
          'Bargaining power — collective volume earns better, more stable prices',
          'Strong governance and transparent payment are what keep a cooperative trusted by its members',
        ]},
        { type: 'callout', text: 'A hub with weak governance or opaque payment loses members fast. Cooperative strengthening — by-laws, transparent quality-based payment, and sound management — is as important as any technical input.' },
        { type: 'h', text: 'Climate-smart dairy' },
        { type: 'pathway', title: 'FEED EFFICIENCY', text: 'Better feed and higher yield per cow lower methane emitted per litre of milk. Producing more from fewer, better-fed animals is itself a mitigation strategy.' },
        { type: 'pathway', title: 'MANURE MANAGEMENT & BIOGAS', text: 'Managed manure becomes fertiliser instead of a methane and runoff problem. A biogas digester turns manure into cooking energy and a nutrient-rich slurry for fodder and crops.' },
        { type: 'pathway', title: 'RESILIENT FEED & ENERGY', text: 'Drought-tolerant fodder and conserved feed buffer the dry season; solar milk chillers cut diesel and grid dependence at collection points.' },
        { type: 'h', text: 'Gender in dairy' },
        { type: 'p', text: 'In ECA dairy, women typically manage the daily cow care — feeding, milking, and calf rearing — while men often control the sale of milk and the income. This split means the people doing the work may not control the reward.' },
        { type: 'list', items: [
          'Quality-based payment through e-Dairy can register the milker and shift income visibility toward women',
          'Support women into cooperative membership, leadership, and direct payment, not just labour',
          'Engage men (through approaches such as EMAP and household dialogues) to share decisions and recognise women\'s contribution',
          'Watch that adopting higher-yielding, more demanding cows does not simply add unpaid work to women\'s day',
        ]},
        { type: 'highlight', text: 'Quality-based payment, strong cooperatives, climate-smart practices, and gender equity are what turn more milk into more income for the people who actually produce it.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Six Dairy Field Scenarios',
    scenarios: [
      {
        situation: 'A smallholder with half an acre, no irrigation, and limited cash wants to buy a pure Friesian cow because a neighbour told her exotic cows give the most milk. She asks you to help her find one.',
        options: [
          { text: 'Help her buy the Friesian — exotic breeds give the most milk, so it is the best investment.', correct: false, feedback: 'A pure exotic cow has high feed, water, and health demands. On half an acre with no irrigation and little cash, she will likely be unable to feed it, and a starved Friesian milks poorly and falls sick. Yield potential means nothing without the feed and management to back it.' },
          { text: 'Discuss matching the breed to her feed and management. Recommend a well-managed cross-breed she can actually feed and cool, plus a fodder and water plan, then build up from there. Connect her to AI services to improve genetics over time.', correct: true, feedback: 'Correct. Match the breed to the feed and management the farmer can provide. A cross-breed she can feed well will out-produce a Friesian she cannot. Genetic improvement through AI can come once the feed base is secure.' },
          { text: 'Tell her dairy is not viable on her land and suggest she focus on crops instead.', correct: false, feedback: 'Defeatist. Smallholder dairy is viable on small plots with zero-grazing and good fodder. The issue is breed-system match, not whether she can keep a cow at all.' },
        ],
      },
      {
        situation: 'A farmer\'s cows milk well in the rainy season but yields collapse every dry season, when he buys expensive dairy meal to compensate. He asks how to keep yields up without the dry-season feed bill.',
        options: [
          { text: 'Advise him to simply buy more dairy meal earlier so he is not caught short.', correct: false, feedback: 'This treats the symptom and raises the feed bill, which is already the biggest cost. Buying feed at the worst time of year is exactly the trap to avoid.' },
          { text: 'Help him conserve fodder when it is abundant — make silage and/or hay in the rains for dry-season feeding — and establish high-yield fodder like napier plus a protein legume. Feed concentrate to yield rather than as the base.', correct: true, feedback: 'Correct. Fodder conservation (silage, hay) is how smallholders keep cows milking through the dry season without buying expensive feed at the worst time. Concentrates supplement a good forage base; they do not replace it.' },
          { text: 'Tell him a dry-season yield drop is unavoidable and he should just accept lower income for those months.', correct: false, feedback: 'The dry-season collapse is largely preventable through fodder conservation and better forage. Accepting it leaves money on the table every year.' },
        ],
      },
      {
        situation: 'At the bulking hub, several deliveries from one route repeatedly fail the alcohol test and show low density on the lactometer. The collector suspects spoilage, but one farmer insists his milk is fine and is angry about rejection.',
        options: [
          { text: 'Accept the milk to keep the farmer happy and avoid conflict at the collection point.', correct: false, feedback: 'Accepting failing milk can spoil the whole bulk tank and breaches food safety. It also undermines every farmer who delivers clean milk and the credibility of quality-based payment.' },
          { text: 'Hold the failing milk, explain the test results plainly, and trace the cause: check cooling time and temperature, milking and equipment hygiene, possible added water (low density), and possible mastitis. Coach the route on the cold chain and clean milking, and use e-Dairy records to show the pattern.', correct: true, feedback: 'Correct. Failing alcohol tests and low density point to spoilage (warm/slow delivery, dirty equipment) or added water. Diagnose the cause, protect the tank, and coach the practice. Quality-based payment plus records make the problem visible and fixable.' },
          { text: 'Permanently expel the angry farmer from the hub.', correct: false, feedback: 'Premature and punitive. The cause has not been established — it could be a fixable cold-chain or hygiene issue. Diagnose and coach first; sanctions are a last resort.' },
        ],
      },
      {
        situation: 'A field officer reports that a cross-bred cow has clots in her milk and a hot, swollen quarter. The farmer has some leftover antibiotics from a previous case and plans to treat her and keep delivering her milk to the hub as usual.',
        options: [
          { text: 'Approve self-treatment with the leftover antibiotics and continued delivery, since the cow still produces milk.', correct: false, feedback: 'This is dangerous on two counts: self-prescribing the wrong drug or dose, and delivering milk with antibiotic residues. Residues can ruin the whole bulk tank and breach food-safety rules.' },
          { text: 'Identify this as clinical mastitis and connect the farmer to a qualified animal-health provider for correct treatment. Insist that the treated cow\'s milk is withheld for the full withdrawal period and never delivered to the hub, and reinforce clean-milking prevention.', correct: true, feedback: 'Correct. Mastitis needs proper diagnosis and treatment by a qualified provider, and the withdrawal period must be observed in full. Staff support access and records; they do not prescribe. Prevention at the milking stool stops the next case.' },
          { text: 'Tell the farmer to just milk out the affected quarter onto the ground and keep delivering the rest of the udder\'s milk normally.', correct: false, feedback: 'Mixing milk from a cow under treatment, even from other quarters, risks residues in the tank, and untreated mastitis can worsen and damage the udder permanently. Get qualified treatment and observe withdrawal.' },
        ],
      },
      {
        situation: 'In a tick-prone area, several farmers have lost cross-bred cows suddenly. Post-mortem points to East Coast Fever. The farmers have been spraying acaricide only occasionally when they remember, and ECF immunisation is available in the district.',
        options: [
          { text: 'Recommend treating each cow with antibiotics at the first sign of illness and continuing the occasional spraying.', correct: false, feedback: 'ECF is a tick-borne parasitic disease, not a typical bacterial infection, and once clinical it is often fatal in susceptible cross-breds. Antibiotics and irregular spraying will not control it. The strategy must be prevention.' },
          { text: 'Establish consistent, correctly-dosed tick control (regular dipping/spraying at the right interval), promote ECF immunisation where available for susceptible animals, and consider zero-grazing to cut tick exposure.', correct: true, feedback: 'Correct. ECF is prevented, not cured. Consistent acaricide use, immunisation where available, and reduced tick exposure protect vulnerable cross-bred and exotic animals. Occasional spraying leaves the door open.' },
          { text: 'Advise the farmers to switch entirely to indigenous cattle and abandon cross-breeding.', correct: false, feedback: 'An over-correction. Indigenous cattle are more tolerant but give far less milk. With proper tick control and immunisation, cross-breds can be kept productively even in tick-prone areas.' },
        ],
      },
      {
        situation: 'A dairy cooperative is rolling out e-Dairy quality-based payment. The board, all men, proposes registering payment accounts in the name of the household head. Women in the cooperative do almost all the milking but are rarely the registered household head.',
        options: [
          { text: 'Register all accounts under the household head as proposed — it is simpler and avoids friction with the board.', correct: false, feedback: 'This entrenches the existing gap: women do the work but men receive the payment. Quality-based payment is a chance to shift income visibility toward women, and defaulting to the household head misses it.' },
          { text: 'Use the e-Dairy rollout to register the actual milk producer where possible so income visibility shifts toward the women doing the work. Pair this with supporting women into membership and leadership, and engage the male board members (e.g. through EMAP-style dialogue) so they back the change.', correct: true, feedback: 'Correct. Quality-based payment systems can shift income visibility toward women when accounts reflect who produces the milk. Combine the technical change with women\'s membership/leadership and bringing men in as allies — transformative work needs all three.' },
          { text: 'Set up a separate women-only cooperative so women control their own payments.', correct: false, feedback: 'Parallel structures rarely scale and weaken women\'s position in the main cooperative, where the volume, services, and market power are. Better to transform the existing cooperative\'s payment and governance.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'Compared with unimproved local cattle on poor feed, improved or cross-bred cows that are well fed and healthy can yield:', options: ['About the same amount of milk', 'Slightly less but better quality', 'Several times more milk', 'Less milk but for longer'], answer: 2 },
    { q: 'In smallholder dairy, the single largest cost is usually:', options: ['Veterinary treatment', 'Feed', 'Transport to the hub', 'Breeding/AI'], answer: 1 },
    { q: 'For a small plot with limited feed and no irrigation, the most appropriate animal is usually:', options: ['A pure exotic Friesian for maximum yield', 'A well-managed cross-breed matched to the available feed', 'An indigenous bull', 'Whatever is cheapest at market'], answer: 1 },
    { q: 'The main advantages of artificial insemination (AI) over keeping a bull include:', options: ['It removes the need for any heat detection', 'Faster genetic gain, no bull to keep, and lower disease transmission', 'It guarantees a calf without a dry period', 'It eliminates the need for feed'], answer: 1 },
    { q: 'East Coast Fever (ECF) is:', options: ['A nutritional deficiency from poor feed', 'A tick-borne parasitic disease, a major killer especially of cross-bred/exotic cattle', 'A bacterial udder infection', 'A virus spread by milk'], answer: 1 },
    { q: 'Sub-clinical mastitis is best described as:', options: ['Visible clots and a hot, swollen udder', 'Invisible inflammation that raises somatic cell count and quietly cuts yield', 'A disease only of indigenous cattle', 'Harmless and not worth managing'], answer: 1 },
    { q: 'Milk from a cow under antibiotic treatment should be:', options: ['Diluted into the bulk tank to spread the residue', 'Delivered as normal since it still looks fine', 'Withheld for the full withdrawal period and never delivered to the hub', 'Boiled and then delivered'], answer: 2 },
    { q: 'The milk let-down reflex:', options: ['Lasts all day once triggered', 'Is a short-lived reflex triggered by udder stimulation (oxytocin), so milk out quickly and calmly', 'Only works with a milking machine', 'Is unaffected by stress or routine'], answer: 1 },
    { q: 'Fodder conservation (silage and hay) is mainly used to:', options: ['Increase milk fat in the rainy season', 'Keep cows milking through the dry season without buying expensive feed at the worst time', 'Replace the need for clean water', 'Speed up the let-down reflex'], answer: 1 },
    { q: 'After milking, bacterial growth in milk is best limited by:', options: ['Adding a preservative such as hydrogen peroxide', 'Delivering fast and cooling quickly to around 4 degrees C', 'Leaving it covered at room temperature overnight', 'Adding clean water to dilute the bacteria'], answer: 1 },
    { q: 'Adding water or preservatives to milk to mask spoilage is:', options: ['Acceptable if the milk is then boiled', 'Fraud and a food-safety hazard, and grounds for rejection', 'Standard practice to increase volume', 'Recommended for the dry season'], answer: 1 },
    { q: 'Quality-based milk payment (e.g. through e-Dairy) pays farmers based on:', options: ['Volume alone', 'Measured milk quality such as hygiene, density, and bacterial/somatic cell counts', 'How many cows they own', 'Distance to the hub'], answer: 1 },
    { q: 'A key climate-smart benefit of better feed efficiency in dairy is:', options: ['It eliminates the need for vaccination', 'Lower methane emitted per litre of milk', 'It removes the need for cooling', 'It makes adulteration safe'], answer: 1 },
    { q: 'In ECA dairy, a common gender pattern is that:', options: ['Men do the daily milking and women sell the milk', 'Women do much of the daily cow care and milking while men often control the sale and income', 'Only women own the cattle', 'Gender has no bearing on dairy income'], answer: 1 },
    { q: 'The main role of a milk-bulking hub or dairy cooperative is to:', options: ['Replace the need for clean milk production', 'Aggregate, cool, and test smallholder milk and give farmers collective market power and services', 'Set government milk prices', 'Provide free exotic cows to all members'], answer: 1 },
  ],
});


COURSES.push({
  id: 'risk',
  title: 'Risk Management',
  subtitle: 'Anticipate, decide, act',
  category: 'Risk',
  icon: commodityIcon(riskIcon),
  duration: '45 min',
  description: 'Learn how Solidaridad ECA identifies, assesses, treats, and reports risks — from the three lines of defense to risk appetite, the likelihood-impact heat map, and your role as a first-line risk owner.',
  lessons: [
    {
      id: 'risk-overview',
      title: 'Why We Manage Risk',
      content: [
        { type: 'p', text: 'Risk is the uncertainty of not achieving our objectives. REC ECA operates across Ethiopia, Kenya, Tanzania, and Uganda, and faces a fast-changing landscape — EUDR and other trade regulations, carbon market and ITMO frameworks, climate shocks, foreign exchange pressures, donor concentration, cybersecurity threats, civic space restrictions, and election-related instability.' },
        { type: 'p', text: 'Risk management is not about eliminating risk. It is about understanding it, so we make better decisions for farmers, partners, donors, and colleagues.' },
        { type: 'list', items: [
          'Proactively identify and prioritise risks rather than avoiding them',
          'Allocate resources where exposure is greatest',
          'Build resilience so disruptions don\'t derail delivery',
          'Protect financial sustainability, reputation, and donor trust',
          'Make confident, evidence-based decisions across the region',
        ]},
        { type: 'highlight', text: 'The goal is not to eliminate risk — it is to make better decisions.' },
        { type: 'callout', text: 'Risk management is the responsibility of every staff member, not just senior leadership.' },
      ],
    },
    {
      id: 'risk-defense',
      title: 'The Three Lines of Defense',
      content: [
        { type: 'p', text: 'REC ECA uses a three lines of defense model — clear ownership separated from oversight and from independent assurance.' },
        { type: 'list', items: [
          'First line — country teams, project managers, and functional leads. You own and manage risks in your day-to-day work.',
          'Second line — Risk & Compliance, Finance, HR, Legal, Procurement, Thematic Leads. They maintain the framework, train staff, monitor, and challenge the first line.',
          'Third line — Internal Audit (or external auditors). They provide independent assurance that controls work as intended.',
        ]},
        { type: 'p', text: 'Ultimate accountability sits with the Managing Director and the Senior Management Team (SMT). Every risk has a named owner — at regional, country, or project level.' },
        { type: 'callout', text: 'If you are a programme, project, or country staff member, you are part of the first line. Identifying and escalating risk is part of your role.' },
      ],
    },
    {
      id: 'risk-process',
      title: 'The Risk Management Process',
      content: [
        { type: 'p', text: 'Risk management is a continuous cycle. It runs through strategy, programme delivery, and daily decisions — not just an annual exercise.' },
        { type: 'list', items: [
          'Establish context — link the risk to REC ECA\'s strategic objectives and the MASP',
          'Identify — what could go wrong, and what opportunities might we miss?',
          'Analyse — what causes this risk, and what are the likelihood and consequences?',
          'Evaluate — how serious is it compared to other risks?',
          'Treat — choose a response: avoid, transfer, mitigate, or accept',
          'Monitor & review — track Key Risk Indicators (KRIs) and update at least annually',
          'Communicate & consult — keep stakeholders informed at every stage',
        ]},
        { type: 'callout', text: 'Every risk identified must be logged on the risk register, linked to a named owner, and assessed for both inherent and residual risk.' },
        { type: 'highlight', text: 'Risk management is most effective when it is embedded in routine work, not bolted on at year-end.' },
      ],
    },
    {
      id: 'risk-assessment',
      title: 'Likelihood, Impact & the Heat Map',
      content: [
        { type: 'p', text: 'Each risk is rated on two scales — how likely it is to occur, and how severe the impact would be if it did. The combination produces a Low, Medium, or High rating on the heat map.' },
        { type: 'list', items: [
          'Rare (1) — may occur once or twice in 10 years',
          'Unlikely (2) — may occur 2-5 times in 10 years',
          'Possible (3) — may occur 5-10 times in 5 years',
          'Likely (4) — may occur at least quarterly',
          'Almost certain (5) — may occur at least monthly',
        ]},
        { type: 'p', text: 'Impact is assessed across five dimensions — pick whichever is most relevant for the risk:' },
        { type: 'list', items: [
          'Financial — % of annual expenditure lost',
          'Reputational — local, national, or international media exposure',
          'Compliance — donor or government reporting and corrective action',
          'Stakeholder — complaints, formal intervention, or litigation',
          'Time delay — operations delay from under a week to over three months',
        ]},
        { type: 'callout', text: 'Always assess inherent risk first (no controls), then residual risk (after controls). The gap between them shows whether your controls are working.' },
        { type: 'highlight', text: 'High-rated risks demand immediate senior management attention. Medium risks need timely action within existing frameworks. Low risks are managed in routine operations.' },
      ],
    },
    {
      id: 'risk-treatment',
      title: 'Treating, Accepting & Reporting Risk',
      content: [
        { type: 'p', text: 'Once a risk is assessed, the risk owner selects one of four treatment options — and documents why.' },
        { type: 'list', items: [
          'Avoid — stop or never start the activity that creates the risk',
          'Transfer (share) — shift the risk to a third party, e.g. insurance or a partner',
          'Mitigate (reduce) — take action to lower the likelihood or the impact',
          'Accept — acknowledge the risk and take no further action because cost of mitigation exceeds the loss',
        ]},
        { type: 'p', text: 'Risk appetite sets the boundaries of what REC ECA is willing to accept. Each risk category has qualitative statements (e.g. "zero tolerance for safeguarding violations") and quantitative limits (e.g. "no single donor over 30% of country funding"). Key Risk Indicators (KRIs) and Early Warning Indicators (EWIs, set at around 80-90% of the limit) trigger action before a breach.' },
        { type: 'callout', text: 'If you must exceed a limit for a strategic or humanitarian reason, submit a Country Risk Waiver. Waivers need SMT approval, are time-bound (typically max 12 months), and trigger enhanced reporting.' },
        { type: 'p', text: 'Material risks are reported quarterly through consolidated dashboards that feed the SMT — covering trend analysis, KRI updates, outstanding treatment actions, and any newly escalating risks.' },
        { type: 'highlight', text: 'When in doubt, escalate. Reporting a risk early is always better than explaining a breach later.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    title: 'Real Risk Decisions',
    scenarios: [
      {
        situation: 'A single donor is on track to contribute 35% of your country office\'s annual funding next year — above the regional 30% concentration limit. The donor has been a long-term partner with strong impact alignment.',
        options: [
          { text: 'Accept the exposure quietly — they are a trusted partner.', correct: false, feedback: 'A breach is a breach, even with a trusted partner. Unreported concentration is exactly the kind of exposure the policy is designed to surface.' },
          { text: 'Submit a Country Risk Waiver to the SMT with rationale, time limit, and a diversification plan.', correct: true, feedback: 'Correct. Waivers exist for exactly this — strategic exposures that exceed the limit need transparent approval, a deadline (max 12 months), and enhanced reporting until exposure is back within bounds.' },
          { text: 'Reject the funding to stay under the limit.', correct: false, feedback: 'Walking away from a strong partnership without exploring waiver or diversification options is rarely the right call. The waiver process exists to make conscious risk-taking transparent, not to block it.' },
        ],
      },
      {
        situation: 'Your country office\'s FX losses are at 4.2% of the operational budget. The 5% Quantitative Risk Limit is approaching, and the Kenyan shilling continues to weaken.',
        options: [
          { text: 'Wait until the 5% limit is breached, then report it.', correct: false, feedback: 'Early Warning Indicators are set at around 80% of the limit for a reason. At 4.2% you have already crossed the EWI and the Country Risk Champion should be proposing corrective action now.' },
          { text: 'Notify the Country Risk Champion and propose mitigation — hedging, supplier renegotiation, or budget reallocation.', correct: true, feedback: 'Correct. EWIs are designed to trigger action before a formal breach. Mitigation now is far cheaper than recovery after a breach.' },
          { text: 'Adjust the FX assumption in the books so the loss looks smaller.', correct: false, feedback: 'Never. This is financial misconduct, not risk management — and it breaks the reporting integrity that the whole framework depends on.' },
        ],
      },
      {
        situation: 'A field officer reports possible labour violations at a partner cooperative in a coffee programme. The programme is mid-cycle and a major donor expects continued delivery.',
        options: [
          { text: 'Investigate quietly after the donor reporting cycle to avoid disruption.', correct: false, feedback: 'Safeguarding has zero tolerance in our risk appetite. Delaying investigation to protect a reporting cycle compounds the harm and the reputational exposure.' },
          { text: 'Escalate immediately to the Country Risk Champion and Safeguarding focal point, pause exposure where needed, and brief the donor transparently.', correct: true, feedback: 'Correct. Safeguarding sits in the highest-priority risk category. Transparent, immediate escalation — even to the donor — protects communities, the programme, and Solidaridad\'s credibility.' },
          { text: 'Drop the partner with no investigation.', correct: false, feedback: 'A blanket termination without facts can harm workers further and expose Solidaridad to disputes. Investigate, document, and act on findings.' },
        ],
      },
      {
        situation: 'An EUDR-driven contract with an offtaker offers strong farmer income but the partner\'s sustainability practices are improving slowly. Due diligence flags moderate environmental and labour risk.',
        options: [
          { text: 'Sign now and address the issues "in due course."', correct: false, feedback: '"Address it later" rarely happens once the ink is dry. Signing without safeguards exposes farmers and Solidaridad to reputational and compliance risk.' },
          { text: 'Engage on conditional terms — binding sustainability milestones, monitoring KRIs, and a right to exit if commitments slip.', correct: true, feedback: 'Correct. This treats the risk through mitigation rather than avoidance — preserving market access while holding the partner accountable. Document the residual risk and assign an owner.' },
          { text: 'Reject the contract outright.', correct: false, feedback: 'Outright rejection may protect Solidaridad on paper but abandons farmers who need market access. Conditional engagement is usually the more solidaristic and the more impact-driven response.' },
        ],
      },
      {
        situation: 'IT detects a possible data breach involving a project beneficiary database. It is unclear whether data has been exfiltrated.',
        options: [
          { text: 'Hold off until you have more information so you do not raise a false alarm.', correct: false, feedback: 'Cybersecurity and data privacy are explicit risk categories in the policy. A possible breach is itself a material risk event — it needs immediate re-evaluation, not silence.' },
          { text: 'Trigger the incident protocol, brief the SMT, re-evaluate the risk\'s likelihood, impact, and velocity, and initiate a root-cause review.', correct: true, feedback: 'Correct. A material incident must be promptly re-assessed and, where appropriate, trigger a deeper review to ensure similar events cannot recur. Speed and transparency protect beneficiaries and the organization.' },
          { text: 'Delete affected records to limit exposure.', correct: false, feedback: 'Destroying evidence undermines investigation, breaches data-handling obligations, and could itself become a compliance violation.' },
        ],
      },
      {
        situation: 'A project manager wants to accept a known risk because mitigation feels too costly and the deadline is tight.',
        options: [
          { text: 'Tick the "accept" box on the risk register and move on.', correct: false, feedback: 'Acceptance is a valid treatment — but only with documented rationale, named approver, time limit (max 12 months), and evidence that reasonable mitigation has been considered.' },
          { text: 'Document the rationale, confirm reasonable mitigations were considered, get SMT approval, set a review date, and log it in the risk register.', correct: true, feedback: 'Correct. Acceptance is transparent, time-bound, and approved at the right level. The cumulative impact of all accepted risks is reviewed by the SMT so the total exposure stays within appetite.' },
          { text: 'Avoid logging it — fewer red items on the register looks better in the dashboard.', correct: false, feedback: 'Hiding risks is the opposite of risk management. The register is the basis for quarterly SMT review — unlogged risks become surprises later.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'Risk management is the responsibility of:', options: ['Only the SMT', 'Only Risk & Compliance', 'Every staff member, with assigned risk owners', 'Internal Audit alone'], answer: 2 },
    { q: 'In the three lines of defense model, country and programme teams are:', options: ['The third line', 'The second line', 'The first line', 'Outside the model'], answer: 2 },
    { q: 'How many key risk categories does the REC ECA framework define?', options: ['Three', 'Five', 'Eight', 'Twelve'], answer: 2 },
    { q: 'The four risk treatment options are:', options: ['Plan, do, check, act', 'Avoid, transfer, mitigate, accept', 'Identify, assess, escalate, ignore', 'Buy, sell, hold, hedge'], answer: 1 },
    { q: 'Inherent risk is best described as:', options: ['Risk after controls are applied', 'Risk before considering any controls', 'Only financial risk', 'A risk that has already occurred'], answer: 1 },
    { q: 'A likelihood rating of "Almost certain" means the event:', options: ['May occur once every 10 years', 'May occur quarterly', 'May occur at least monthly', 'Has already occurred'], answer: 2 },
    { q: 'What does KRI stand for?', options: ['Key Risk Indicator', 'Known Risk Item', 'Kenyan Risk Index', 'Key Reporting Item'], answer: 0 },
    { q: 'A Country Risk Waiver is approved by:', options: ['Any line manager', 'The Senior Management Team (SMT)', 'The donor', 'The first staff member to spot it'], answer: 1 },
    { q: 'A risk waiver is typically time-bound to a maximum of:', options: ['3 months', '6 months', '12 months', 'Indefinite'], answer: 2 },
    { q: 'Material risks must be reported to the SMT at minimum:', options: ['Annually', 'Quarterly', 'Only when a breach occurs', 'Never — only when audited'], answer: 1 },
  ],
});


COURSES.push({
  id: 'finance-policy',
  title: 'Finance, Procurement & Expenses',
  subtitle: 'Spend smart, stay compliant',
  category: 'Finance',
  icon: commodityIcon(financePolicyIcon),
  duration: '1 hr 35 min',
  description: 'A comprehensive, scenario-driven walk through the 2025 ECA Finance & Procurement Manual (Issue No. 5), the Travel & Expenses Policy and QSP, and ECA leadership guidance on co-financing, controls and audit readiness. Across fourteen modules you will learn how money flows through Solidaridad ECA — how we plan, approve, travel, claim, buy, pay, bank, allocate and account — so every euro and shilling is traceable, justified and trusted.',
  lessons: [
    {
      id: 'fin-why',
      title: 'Why Every Shilling Has a Story',
      content: [
        { type: 'p', text: 'Solidaridad ECA manages money that belongs to donors, partners and the communities we serve. The Finance & Procurement Manual (Issue No. 5, approved 19 May 2025) and the Travel & Expenses Policy exist so that every euro, shilling, birr or schilling can be traced, justified and trusted. This is not red tape — it is how we protect our reputation and keep funding flowing.' },
        { type: 'highlight', text: 'If it is not documented, it did not happen. Every payment, trip and purchase needs a paper trail.' },
        { type: 'list', title: 'The three principles behind every rule', items: [
          'Value for money — we get the best outcome for what we spend.',
          'Transparency & accountability — decisions are documented and auditable.',
          'Compliance — we follow internal policy, donor rules and local law.',
        ] },
        { type: 'callout', title: 'Who owns the money?', text: 'The Managing Director (MD) carries overall responsibility for ECA’s financial management, advised by the Financial Controller (FC) and the Management Team (MD, FC, Head of Programmes). But financial controls only work if every staff member plays their part.' },
        { type: 'p', text: 'Two golden override rules to remember: where a donor’s rules are stricter than ours, the donor’s rules win. And where national law differs from the Manual, the law of the country supersedes the Manual.' },
      ],
    },
    {
      id: 'fin-money-map',
      title: 'The Money Map: Systems, Currencies & the Year',
      content: [
        { type: 'p', text: 'Before the rules make sense, it helps to see how money is recorded. ECA runs a cloud-based accounting system (such as Certinia) that handles multiple currencies, converts at current rates, and keeps secure backups across separate locations.' },
        { type: 'pathway', title: 'FROM RECEIPT TO REPORT', text: 'Source documents are collected, transactions recorded and classified to the right project, ledgers reviewed monthly, financial statements prepared, auditors engaged, and finally the MD makes management decisions. Every stage has a named owner.' },
        { type: 'value', title: 'FISCAL YEAR', text: 'ECA’s financial year runs 1 January to 31 December.' },
        { type: 'value', title: 'CURRENCY', text: 'The base currency is the currency of the country where an office is registered; the dual reporting currency is the Euro. Donor funds are banked in the donor currency where possible.' },
        { type: 'list', title: 'Standards we follow', items: [
          'International Financial Reporting Standards (IFRS) and Solidaridad GAAP.',
          'Financial records are kept electronically and retained for at least 7 years.',
          'Grant income is recognised on a utilisation basis.',
        ] },
        { type: 'highlight', text: 'Donor compliance and local law both sit above this Manual — when they are stricter, they take precedence.' },
      ],
    },
    {
      id: 'fin-authority',
      title: 'Who Can Approve What',
      content: [
        { type: 'p', text: 'Authority levels define who may approve which transactions, and up to what value. Setting these levels rests with the MD, and they exist to put the right level of oversight behind every decision.' },
        { type: 'list', title: 'Key control points', items: [
          'Every ECA bank account needs a minimum of 2 authorised signatories; the MD and FC are the primary signatories (the HR Manager is the alternate).',
          'The MD is the final authoriser for all disbursements.',
          'The MD may delegate approval or signing to a Management Team member.',
          'Budgets are submitted to donors by the MD, in consultation with the FC.',
        ] },
        { type: 'callout', title: 'When something is unusual', text: 'Approvals that exceed a person’s limit, or high-risk and unusual transactions, follow an escalation process — a secondary review by the FC or MD, and sometimes external verification or audit.' },
        { type: 'highlight', text: 'Know your limit. If a decision is above your authority, escalate it — never split a purchase to stay under a threshold.' },
      ],
    },
    {
      id: 'fin-budget',
      title: 'Budgets, Cost Centres & Overheads',
      content: [
        { type: 'p', text: 'A budget is a plan for the year ahead. ECA’s annual budgeting cycle starts mid-year so that activities, people and money line up before January.' },
        { type: 'pathway', title: 'THE BUDGET CYCLE', text: 'July–August: the Management Team plans and managers draft programme budgets. The FC compiles a consolidated budget for the MD. October–November: the MD presents the approved budget (after Board approval) to staff.' },
        { type: 'list', title: 'Budgeting with discipline', items: [
          'Design and manage budgets strictly in line with the contract’s expenditure requirements.',
          'Apply the correct overhead / indirect-cost percentages from the Manual (typically 7% donors, 8% private companies, 6% individuals).',
        ] },
        { type: 'list', title: 'When reality differs from the plan', items: [
          'Underspending: find the cause early and, with donor approval, reallocate to avoid waste.',
          'Overspending: act immediately, find the root cause, use contingency or reallocation, and tell the donor where required.',
          'Acceleration: spending faster than planned is fine only if it does not starve later activities of cash.',
        ] },
        { type: 'callout', title: 'Cost-centre coding', text: 'Every travel and procurement cost must be charged to the correct cost centre / project code. When in doubt — especially for a new project — confirm the code with Finance before you submit.' },
      ],
    },
    {
      id: 'fin-cofinance',
      title: 'Co-financing, Cost Allocation & Timesheets',
      content: [
        { type: 'p', text: 'As our portfolio grows, projects can share resources — infrastructure, partnerships, expertise and lessons learned — to increase efficiency and impact. This is co-financing, and it must always be intentional, transparent and well documented.' },
        { type: 'list', title: 'Doing co-financing right', items: [
          'Identify and document synergies during project design, not after the fact.',
          'Budget co-financing transparently and align it with donor rules and cost-allocation principles.',
          'Co-financing decisions are approved by the Country Managers, the Head of Programmes and the regional finance team.',
          'It applies to both cash and in-kind contributions (staff time, office space, equipment, vehicles, technical assistance).',
        ] },
        { type: 'highlight', text: 'The golden rule of cost allocation: a cost or contribution may be counted ONCE. Never claim the same cost under more than one project, donor or funding source.' },
        { type: 'list', title: 'Allocating shared costs', items: [
          'Use a reasonable, documented and consistently applied method that reflects the actual benefit to each project.',
          'Shared procurement, travel, training and operational costs are apportioned on documented criteria.',
          'Keep a clear audit trail showing how shared costs and contributions were valued and allocated.',
        ] },
        { type: 'callout', title: 'Timesheets & effort reporting', text: 'Staff working on more than one project must record actual time on approved timesheets, completed and approved promptly. Salary costs are charged in proportion to real effort, and staff time given as an in-kind contribution must also be backed by timesheets.' },
      ],
    },
    {
      id: 'fin-travel-before',
      title: 'Travel: Plan & Approve',
      content: [
        { type: 'p', text: 'Good trips start with good planning. Every business trip needs advance approval — never book first and ask later.' },
        { type: 'pathway', title: 'THE APPROVAL CHAIN', text: 'Raise a Travel Request Form (destination, purpose, dates, estimated costs) → get your Line Manager’s sign-off → the Project Manager reviews it → the Country Manager gives final approval.' },
        { type: 'list', title: 'Booking the smart way', items: [
          'Book flights at least 3 weeks ahead to catch discounted fares.',
          'Use ECA’s preferred suppliers — the Operations team arranges bookings.',
          'Economy class is mandatory. Exceptions only for flights over 8 hours, medical reasons, or where your contract specifies otherwise.',
          'Book hotels through the Operations team at least 2 weeks before travel — usually 3 to 4-star, at the best corporate rate.',
        ] },
        { type: 'callout', title: 'Who pays the hotel?', text: 'ECA pays accommodation directly to the hotel (bed & breakfast). You do not pay and claim it back — so book through Operations early.' },
        { type: 'highlight', text: 'Need a travel advance? The request must be approved at least 2 weeks before you travel.' },
        { type: 'p', text: 'Before you fly: check your passport and visa are valid, confirm any vaccinations (ECA covers visa and vaccination costs for business travel), and check travel advisories for your destination. ECA’s travel insurance covers authorised business travel — but not high-risk recreational activities.' },
      ],
    },
    {
      id: 'fin-expenses-perdiem',
      title: 'Expenses I: Per Diem & What Counts',
      content: [
        { type: 'p', text: 'This is where most staff meet finance policy in daily life: spending while on duty. The prepaid card is your best friend — use the Solidaridad prepaid (or corporate) card for all business expenses wherever possible, and keep every original tax receipt.' },
        { type: 'callout', title: 'Never mix money', text: 'Personal expenses must NEVER be charged to the prepaid or corporate card. If a personal item lands on your hotel bill, settle it yourself at checkout.' },
        { type: 'stat', value: 'KES 2,000', label: 'Daily Subsistence Allowance per day in Kenya — rates are UN-based and reviewed annually' },
        { type: 'list', title: 'How the Daily Subsistence Allowance (DSA) works', items: [
          'It covers meals, non-alcoholic drinks and minor incidentals (local transport, tips).',
          'Accommodation is NOT in the DSA — ECA pays the hotel directly.',
          'Non-duplication: if meals are already provided (e.g. at an event), the DSA is reduced.',
          'Rates vary by country (e.g. Kenya KES 2,000/day; Ethiopia tax-exempt up to 2.5% of basic salary; Uganda exempt with a travel report; Tanzania transport supported by documentation). For remote or unlisted places, confirm with Finance first.',
        ] },
        { type: 'list', title: 'What ECA will NOT reimburse', items: [
          'Tobacco, alcohol and personal toiletries.',
          'Hotel minibar (except water), in-room movies and personal phone calls.',
          'Laundry — unless the trip is over 4 consecutive nights, and then capped at USD 20 per week.',
          'Gifts or souvenirs over USD 100 must be reported and justified.',
        ] },
        { type: 'callout', title: 'Entertainment & covering others', text: 'Reasonable customer/supplier entertainment is itemised on the Travel Expense Report; entertainment before or after a business discussion needs MD pre-authorisation. If you pay for another staff member’s approved costs, get pre-approval, keep every receipt, and code it to the correct cost centre.' },
      ],
    },
    {
      id: 'fin-expenses-claim',
      title: 'Expenses II: Claiming & Accounting',
      content: [
        { type: 'p', text: 'Spending is only half the job — accounting for it correctly is the other half, and it is where advances are cleared and trust is earned.' },
        { type: 'pathway', title: 'CLAIM THE RIGHT WAY', text: 'Submit your Travel Expense Report within 7 days of returning, with original receipts, the correct cost-centre codes and a field-visit report. Convert any foreign-currency spend using the Oanda rate on the date of the expense.' },
        { type: 'list', title: 'Your submission checklist', items: [
          'Completed Travel Expense Report.',
          'Boarding passes or passport stamps (where applicable).',
          'A field-visit report approved by your supervisor.',
          'Hotel bills, airline tickets and all other original receipts.',
        ] },
        { type: 'highlight', text: 'One trip at a time: you cannot hold two travel advances at once. Account fully for the last trip first — any advance not surrendered within 7 days can be recovered from your salary.' },
        { type: 'callout', title: 'Late retirements', text: 'If a retirement (accounting for an advance) is running late, manage it promptly and in a controlled way — escalate to your Country Manager, who will coordinate with HR where necessary. Accounts stay unpaid until all required documents are received.' },
        { type: 'p', text: 'Keep your travel documentation securely for at least 7 years. Prompt, complete reporting is also the fastest way to be reimbursed.' },
      ],
    },
    {
      id: 'fin-procure-methods',
      title: 'Procurement: Methods & Thresholds',
      content: [
        { type: 'p', text: 'Procurement is simply how we buy goods and services fairly. The method you must use depends on the value of what you are buying — bigger spend means more competition and more oversight.' },
        { type: 'pathway', title: 'UNDER €500 · PRUDENT SHOPPING', text: 'Buy directly from a local supplier, but still get at least 3 verbal or written quotes and keep a quote analysis. (Approved by the Country Manager.)' },
        { type: 'pathway', title: '€500 – €15,000 · WRITTEN QUOTES', text: 'Obtain at least 3 written quotes and pick the best-value supplier against clear criteria (quality, price, delivery). The Tender Evaluation Committee (TEC) authorises the supplier.' },
        { type: 'pathway', title: '€15,000 – €100,000 · COMPETITIVE BIDDING', text: 'Run a formal competitive bid — invite prequalified suppliers, consider at least 3 bids, and let the TEC evaluate against predefined criteria.' },
        { type: 'pathway', title: 'OVER €100,000 · OPEN TENDER', text: 'Advertise an open, public tender with explicit evaluation criteria. The TEC adjudicates and appoints the supplier.' },
        { type: 'callout', title: 'Single-sourcing (one supplier, no competition)', text: 'Allowed only when there is genuinely one supplier, continuity is essential, or there is a real emergency — and always with written justification, TEC consultation first, then MD approval, documented in the procurement file.' },
        { type: 'highlight', text: 'Never split one purchase into smaller ones to dodge a threshold. The value of the whole requirement decides the method.' },
      ],
    },
    {
      id: 'fin-procure-suppliers',
      title: 'Procurement: Suppliers, TEC & Evidence',
      content: [
        { type: 'p', text: 'Fair process needs good suppliers, clean decisions and watertight evidence. ECA keeps a Pre-Qualified Supplier List (PQL) of vendors assessed on financial stability, performance history, compliance and reputation, reviewed at least annually.' },
        { type: 'list', title: 'Strong TEC governance', items: [
          'The TEC normally meets every Tuesday; each meeting needs at least 4 members.',
          'Every meeting opens with a formal conflict-of-interest declaration, captured in the minutes; members recuse themselves on items they are connected to.',
          'TEC evaluation matrices must be fully signed (DocuSign or Google e-signature) before any Purchase Order is authorised.',
          'Meetings are formally minuted and stored centrally with the signed matrices — and once decisions are finalised and signed, the documents are locked against further editing.',
        ] },
        { type: 'list', title: 'Evidence to keep on file', items: [
          'Proof of adverts (website, email or other formats).',
          'Delivery notes / goods-received notes.',
          'Acknowledgement of payment receipt.',
          'Beneficiaries’ acknowledgement of receipt.',
        ] },
        { type: 'callout', title: 'Buying IT kit', text: 'Purchase computer hardware only from approved preferred vendors, following the standard specifications for your staff cluster. MacBooks are approved only case-by-case on technical need. Hardware follows a 5-year refresh cycle, and only full-time staff qualify for a refresh.' },
        { type: 'highlight', text: 'If you cannot demonstrate compliance during an audit, it counts as non-compliance. Strong record-keeping is the proof that good process happened.' },
      ],
    },
    {
      id: 'fin-payments',
      title: 'The Payment Process',
      content: [
        { type: 'p', text: 'Payments run on a predictable weekly rhythm so Finance can verify everything properly. Plan ahead and your supplier or reimbursement is never late.' },
        { type: 'pathway', title: 'THE PAYMENT WEEK', text: 'Finance prepares payments on Wednesday → the FC reviews on Thursday → the MD authorises on Friday. Salaries are processed after the 23rd of each month.' },
        { type: 'highlight', text: 'No approved requisition, Purchase Order or signed contract — no funds. Payments are gated on the paperwork being complete and approved.' },
        { type: 'list', title: 'Give Finance enough runway', items: [
          'Submit source documents to procurement at least 4 weeks before the activity, or to Finance at least 2 weeks before.',
          'Every payment file needs (in order): Delivery Note, Local Purchase Order, Invoices/receipts, Supporting Quotations — plus TEC minutes where applicable.',
          'All procurement and payment documents are uploaded and retained in the central drive, with a complete, traceable audit trail.',
          'Advance payments over EUR 10,000 to a new supplier need a signed contract, a bank guarantee and valid registration/tax documents.',
        ] },
        { type: 'callout', title: 'Consultants & partners', text: 'Project Managers verify delivery (a report and signed payment request, or a delivery note for goods) and submit to the Regional PMEL Manager for approval before payment. Once a contract is signed, the bank details cannot be changed.' },
      ],
    },
    {
      id: 'fin-cash-bank',
      title: 'Cash, Banking & Petty Cash',
      content: [
        { type: 'p', text: 'ECA banks online and keeps cash handling to a minimum. Monthly bank reconciliations are prepared and independently reviewed by the 15th of the following month.' },
        { type: 'stat', value: 'KES 25,000', label: 'Maximum petty-cash float at country offices (EUR 150.25); head office is KES 50,000 (EUR 340)' },
        { type: 'list', title: 'Petty cash discipline', items: [
          'It runs on an imprest basis: physical cash + supporting receipts must always equal the float.',
          'Replenish when the float drops to the threshold (about EUR 75 / KES 10,000).',
          'Petty cash is for small incidentals only — never use it to dodge the procurement process.',
          'Disbursements need original receipts and FAO pre-approval; cash is stored securely and checked quarterly.',
        ] },
        { type: 'list', title: 'Banking essentials', items: [
          'Official receipts or email confirmations are issued for all money received; cheques are banked within 3 working days.',
          'Creditor payments are made by online bank transfer.',
        ] },
        { type: 'callout', title: 'Managing foreign exchange', text: 'ECA handles many currencies (USD, GBP, EUR, DKK; KES, ETB, UGX, TZS). Fund-transfer requests go in 2 weeks ahead; for transfers above EUR 100,000 the FC seeks competitive forex rates. Forex gains and losses are disclosed to the donor.' },
      ],
    },
    {
      id: 'fin-controls',
      title: 'Financial Controls & Audit Readiness',
      content: [
        { type: 'p', text: 'Good controls catch errors before they become problems — and the best controls are built into the system, not left to memory. Our aim is compliance by design, with a complete, traceable record behind every transaction.' },
        { type: 'list', title: 'Integrity & accuracy controls', items: [
          'Record and reconcile all transactions regularly — monthly reconciliations catch discrepancies early.',
          'Use correct decimal precision in every financial entry.',
          'Review dormant accounts yearly and close them where needed.',
          'Process advance retirements within the defined timelines so balances do not stay open.',
        ] },
        { type: 'list', title: 'Records & audit readiness', items: [
          'Store every document in the correct central Google Drive folder, complete and clearly filed.',
          'Keep records consistent and standardised across all teams and regions.',
          'Keep soft and hard copies for at least 7 years and be ready for internal or regional checks at any time.',
          'Actively follow up outstanding payments until they are fully received and cleared.',
        ] },
        { type: 'highlight', text: 'Reflection: where do we still rely on a person remembering, rather than the system enforcing? Those are the gaps an auditor will find first.' },
      ],
    },
    {
      id: 'fin-assets',
      title: 'Assets, Reserves & Sustainability',
      content: [
        { type: 'p', text: 'The rules do not stop at payments. Assets, reserves and good stewardship keep ECA resilient and sustainable.' },
        { type: 'list', title: 'Looking after assets', items: [
          'Items worth more than EUR 700 go on the fixed-asset register and are tagged and physically verified annually.',
          'Disposing of an asset worth over EUR 1,000 needs a valuation; all disposals go through the TEC/Asset Disposals Committee and are approved by the MD, with priority given to staff.',
          'Private use of a Solidaridad asset needs Country Manager authorisation and written MD approval.',
        ] },
        { type: 'list', title: 'Resilience built in', items: [
          'ECA maintains reserves to cover overheads, absorb forex losses, manage emergencies and meet severance obligations.',
          'Investments avoid sectors that conflict with our ethics (e.g. arms, tobacco).',
          'Pre-financing is discouraged and needs a formal agreement, an FC recommendation and MD approval.',
        ] },
        { type: 'callout', title: 'Emergencies', text: 'For genuine emergency procurement, ECA uses a streamlined but still-documented process, approved by the MD and FC and reviewed by the Management Team afterwards.' },
        { type: 'highlight', text: 'Master these basics and you protect every project: spend with a plan, allocate fairly, keep your receipts, follow the thresholds, verify before you pay, and account on time.' },
      ],
    },
  ],
  interactive: {
    type: 'scenario',
    intro: 'You are travelling, buying, claiming, allocating and accounting on Solidaridad business. Make the call that keeps you compliant.',
    scenarios: [
      {
        situation: 'It is Monday. You need to fly for a workshop next Monday — 7 days away — and you’d prefer business class for the 2-hour hop. What do you do?',
        options: [
          { text: 'Book a business-class ticket yourself today and claim it later.', correct: false, feedback: 'Two problems: economy is mandatory for a short flight, and you should book through Operations / preferred suppliers, not pay-and-claim.' },
          { text: 'Ask Operations to book an economy fare through a preferred supplier, and flag that timing is tight.', correct: true, feedback: 'Correct. Economy is the rule (exceptions are flights over 8 hours, medical or contractual), and Operations books through preferred suppliers. Flights should ideally be booked 3 weeks ahead — so raise it early.' },
          { text: 'Wait until the day before and book whatever is cheapest.', correct: false, feedback: 'Last-minute booking usually costs more and breaks the 3-weeks-ahead guidance. Plan early.' },
        ],
      },
      {
        situation: 'You got back from a field trip 10 days ago and still haven’t filed your expense report. Now you need an advance for a new trip. What’s the issue?',
        options: [
          { text: 'No issue — just request the new advance.', correct: false, feedback: 'You cannot hold two advances at once, and your report is already overdue (the limit is 7 days). Unaccounted advances can be recovered from your salary.' },
          { text: 'File and fully account for the last trip first, then request the new advance.', correct: true, feedback: 'Correct. Submit the Travel Expense Report within 7 days, account fully for the previous advance, then raise the next request — one trip at a time. If it is running late, escalate to your Country Manager.' },
          { text: 'Combine both trips into one report next month.', correct: false, feedback: 'Reports are due within 7 days of each trip; rolling them together breaks the timeline and risks salary recovery of the open advance.' },
        ],
      },
      {
        situation: 'At checkout, your 2-night hotel bill includes a USD 12 minibar beer and a USD 15 laundry charge. How should you handle it?',
        options: [
          { text: 'Pay the beer and laundry yourself; only claim the room and eligible costs.', correct: true, feedback: 'Correct. Alcohol and minibar (except water) are never reimbursed, and laundry is only covered on trips over 4 consecutive nights (capped at USD 20/week). Settle personal items at checkout.' },
          { text: 'Claim the full bill — it was all on one invoice.', correct: false, feedback: 'No. Alcohol/minibar are excluded, and laundry on a 2-night trip is not eligible. Personal items must be paid by you.' },
          { text: 'Charge it all to the prepaid card to sort out later.', correct: false, feedback: 'Personal items must never go on the prepaid card. Pay them yourself at the hotel.' },
        ],
      },
      {
        situation: 'You split your week across two donor-funded projects. How should your salary cost be charged?',
        options: [
          { text: 'Charge 100% to whichever project has more budget left.', correct: false, feedback: 'That misstates effort and risks double-counting. Salary must follow actual effort, not budget convenience.' },
          { text: 'Record actual time on approved timesheets and allocate salary in proportion to real effort on each project.', correct: true, feedback: 'Correct. Staff on multiple projects record actual time on approved timesheets, and salary is allocated by real effort — including staff time given as an in-kind contribution.' },
          { text: 'Estimate a 50/50 split without timesheets — it’s roughly right.', correct: false, feedback: 'Allocation must be documented and based on actual effort. Donors often require detailed timesheet evidence.' },
        ],
      },
      {
        situation: 'Two projects will share the cost of one training event. How do you treat the cost?',
        options: [
          { text: 'Claim the full cost under both projects — twice the impact reported.', correct: false, feedback: 'That is double-counting and is prohibited. A cost may be counted only once.' },
          { text: 'Apportion it between the projects using a documented, consistent method that reflects actual benefit.', correct: true, feedback: 'Correct. Shared costs are allocated once, on a reasonable and documented basis, with a clear audit trail — and co-financing is approved by the CMs, HOP and regional finance.' },
          { text: 'Put it all on whichever project is easiest to charge.', correct: false, feedback: 'Allocation must reflect the actual benefit to each project and be documented — not chosen for convenience.' },
        ],
      },
      {
        situation: 'Your project needs 6 laptops at about EUR 8,000 total. Which procurement route is correct?',
        options: [
          { text: 'Just buy them from a shop you like — it’s urgent.', correct: false, feedback: 'Direct purchase (prudent shopping) only applies under EUR 500. EUR 8,000 needs written quotes and TEC authorisation.' },
          { text: 'Get at least 3 written quotes, pick the best value, and have the TEC authorise the supplier.', correct: true, feedback: 'Correct. Spend between EUR 500 and EUR 15,000 needs at least 3 written quotes and TEC authorisation — and buy from approved preferred vendors following standard specs.' },
          { text: 'Run a full public open tender.', correct: false, feedback: 'Open tender is for spend over EUR 100,000. For EUR 8,000, three written quotes is the right (and proportionate) method.' },
        ],
      },
      {
        situation: 'A EUR 20,000 purchase feels like a lot of process, so a colleague suggests splitting it into three EUR 6,667 orders. Is that OK?',
        options: [
          { text: 'Yes — smaller orders are simpler to approve.', correct: false, feedback: 'No. Splitting a requirement to fall under a threshold defeats the controls and is a serious procurement breach.' },
          { text: 'No — the whole requirement is EUR 20,000, so use the competitive-bidding method.', correct: true, feedback: 'Correct. The value of the entire requirement sets the method; EUR 15,000–100,000 means competitive bidding through the TEC.' },
          { text: 'Only split it if different people approve each part.', correct: false, feedback: 'Still a breach. The method is decided by the total value of the need, never by how you slice the paperwork.' },
        ],
      },
      {
        situation: 'A purchase order is needed urgently, but the TEC evaluation matrix has not been signed yet. Can the PO go ahead?',
        options: [
          { text: 'Yes — sign the matrix afterwards to save time.', correct: false, feedback: 'No. The PO cannot be authorised until the evaluation matrix is fully signed; signing afterwards breaks the control and fails audit.' },
          { text: 'No — the evaluation matrix must be fully signed first, then the PO is authorised and the documents are locked.', correct: true, feedback: 'Correct. Matrices are fully signed (DocuSign/e-signature) before any PO, meetings are minuted with a COI declaration, and finalised documents are locked against edits.' },
          { text: 'Yes — urgency overrides the paperwork.', correct: false, feedback: 'Genuine emergencies still require documentation and MD/FC approval. Skipping the signed matrix is not permitted.' },
        ],
      },
      {
        situation: 'A highly specialised software service is genuinely only available from one vendor. You want to skip the quotes. Can you?',
        options: [
          { text: 'Yes — just buy it; there is only one supplier anyway.', correct: false, feedback: 'Single-sourcing is allowed in this case, but never without process. You still need justification and approval.' },
          { text: 'Write a justification, consult the TEC first, then get MD approval before committing.', correct: true, feedback: 'Correct. Single-sourcing (sole supplier, continuity, or emergency) requires written justification, TEC consultation, and MD approval, all documented in the procurement file.' },
          { text: 'Ask a friend in another team to approve it quietly.', correct: false, feedback: 'Never. Approvals must follow the authority levels — TEC then MD — and be documented and auditable.' },
        ],
      },
    ],
  },
  quiz: [
    { q: 'ECA’s fiscal year runs:', options: ['1 July – 30 June', '1 January – 31 December', '1 April – 31 March', 'It varies by donor'], answer: 1 },
    { q: 'The dual reporting currency for ECA financial statements is the:', options: ['US dollar', 'Euro', 'Kenyan shilling', 'British pound'], answer: 1 },
    { q: 'Every ECA bank account needs a minimum of how many authorised signatories?', options: ['One', 'Two', 'Three', 'Five'], answer: 1 },
    { q: 'In co-financing, a single cost or contribution may be claimed under:', options: ['As many projects as you like', 'Only one project, donor or funding source', 'Two projects maximum', 'Any project with budget left'], answer: 1 },
    { q: 'Staff working on multiple projects must allocate their salary cost based on:', options: ['Which project has more budget', 'Actual effort recorded on approved timesheets', 'A flat 50/50 split', 'The Country Manager’s preference'], answer: 1 },
    { q: 'How much of a project budget is retained for NS (network support/management)?', options: ['1%', '2%', '5%', '10%'], answer: 1 },
    { q: 'Within how many days of returning must you submit your travel expense report?', options: ['3 days', '7 days', '14 days', '30 days'], answer: 1 },
    { q: 'Economy class is mandatory EXCEPT when:', options: ['You are tired', 'The flight is over 8 hours, or for medical/contractual reasons', 'You booked late', 'A colleague is flying business'], answer: 1 },
    { q: 'How far in advance should flights normally be booked?', options: ['3 days', '1 week', '3 weeks', '3 months'], answer: 2 },
    { q: 'The Daily Subsistence Allowance (DSA) in Kenya is:', options: ['KES 500/day', 'KES 2,000/day', 'KES 10,000/day', 'Whatever you spend'], answer: 1 },
    { q: 'Which expense is NOT reimbursed by Solidaridad?', options: ['A business lunch', 'Alcohol and minibar items (except water)', 'A taxi to a meeting', 'An eligible visa fee'], answer: 1 },
    { q: 'Foreign-currency expenses are converted using:', options: ['Any rate you like', 'The Oanda rate on the date of the expense', 'Last year’s rate', 'The airport kiosk rate'], answer: 1 },
    { q: 'A purchase of EUR 8,000 requires:', options: ['A direct purchase, no quotes', 'At least 3 written quotes and TEC authorisation', 'An open public tender', 'Only the Country Manager’s nod'], answer: 1 },
    { q: 'Contracts over EUR 100,000 must use:', options: ['Prudent shopping', '3 verbal quotes', 'An open tender process', 'Petty cash'], answer: 2 },
    { q: 'Splitting one large purchase into smaller orders to stay under a threshold is:', options: ['Smart budgeting', 'A procurement breach that defeats the controls', 'Fine if urgent', 'Allowed under EUR 500'], answer: 1 },
    { q: 'Before a Purchase Order is authorised, the TEC evaluation matrix must be:', options: ['Drafted only', 'Fully signed (and documents then locked)', 'Emailed to the supplier', 'Approved verbally'], answer: 1 },
    { q: 'Every payment file must include, in order:', options: ['Only an invoice', 'Delivery note, local purchase order, invoices/receipts, supporting quotations', 'A WhatsApp message', 'The supplier’s logo'], answer: 1 },
    { q: 'No funds may be disbursed without:', options: ['A verbal request', 'An approved requisition, Purchase Order and/or signed contract', 'A friendly reminder', 'The supplier’s thank-you note'], answer: 1 },
    { q: 'Supporting documents for transactions should be:', options: ['Kept on a personal laptop', 'Uploaded and retained in the central Google Drive with a full audit trail', 'Printed and taken home', 'Deleted after payment'], answer: 1 },
    { q: 'Bank reconciliations should be performed:', options: ['Once a year', 'Monthly', 'Only before an audit', 'Never'], answer: 1 },
    { q: 'Who gives final authorisation for payments each week?', options: ['Any line manager', 'The Office Manager', 'The Managing Director (on Friday)', 'The supplier'], answer: 2 },
    { q: 'An item must go on the fixed-asset register if it is worth more than:', options: ['EUR 100', 'EUR 700', 'EUR 5,000', 'EUR 10,000'], answer: 1 },
    { q: 'Financial records must be kept for at least:', options: ['1 year', '3 years', '7 years', 'Forever'], answer: 2 },
    { q: 'If a donor’s rules are stricter than ECA policy, you should:', options: ['Ignore the donor', 'Follow the donor’s rules', 'Average the two', 'Ask the supplier'], answer: 1 },
  ],
});


// All commodity courses are now full courses (no placeholders remain).


// ===== Course clusters (catalog grouping) =====
const CLUSTERS = [
  {
    name: 'Strategy & Organisational Excellence',
    blurb: 'Strategy, people, communications, and how we measure what we change.',
    courseIds: ['masp', 'welcome', 'finance-policy', 'brand', 'pmel'],
  },
  {
    name: 'Governance, Ethics & Compliance',
    blurb: 'The standards we hold ourselves to and the channels that keep us accountable.',
    courseIds: ['integrity', 'risk', 'ethics'],
  },
  {
    name: 'Innovation & Strategic Transformation',
    blurb: 'Climate, finance, gender, and the digital tools driving systems change.',
    courseIds: ['climate', 'finance', 'gender', 'digital'],
  },
  {
    name: 'Commodities',
    blurb: 'Crop, livestock, mining, and fashion value-chain curricula across our ECA commodities.',
    courseIds: ['soy', 'coffee', 'tea', 'fruits-veg', 'food-crops', 'gold', 'leather', 'dairy', 'cotton-textile', 'oil-palm', 'cocoa'],
  },
  {
    name: 'Sustainability & Responsible Business',
    blurb: 'Pricing, trade, and the regulations shaping how we do business.',
    courseIds: ['truepricing', 'eudr'],
  },
];


// ===== Storage helpers (Firestore-backed, per-user) =====
async function loadProgress(uid) {
  if (!uid) return {};
  try {
    const snap = await getDocs(collection(db, 'users', uid, 'progress'));
    const out = {};
    snap.forEach(d => { out[d.id] = d.data(); });
    return out;
  } catch (e) {
    console.error('loadProgress failed', e);
    return {};
  }
}

async function saveCourseProgress(uid, courseId, partial, opts = {}) {
  if (!uid) return;
  try {
    const payload = {
      ...partial,
      lastViewedAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    };
    if (opts.startedAt) payload.startedAt = serverTimestamp();
    if (opts.completedAt) payload.completedAt = serverTimestamp();
    await setDoc(
      doc(db, 'users', uid, 'progress', courseId),
      payload,
      { merge: true },
    );
  } catch (e) {
    console.error('saveCourseProgress failed', e);
  }
}

async function loadUserName(uid) {
  if (!uid) return '';
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? (snap.data().displayName || '') : '';
  } catch (e) {
    console.error('loadUserName failed', e);
    return '';
  }
}

async function saveUserName(uid, name) {
  if (!uid || !name) return;
  try {
    await setDoc(
      doc(db, 'users', uid),
      { displayName: name, updatedAt: serverTimestamp() },
      { merge: true },
    );
  } catch (e) {
    console.error('saveUserName failed', e);
  }
}

// Load the user's role from their /users/{uid} doc, creating the doc on
// first login if it doesn't exist. Seed admins (per SEED_ADMINS) are
// auto-promoted to 'admin' on EVERY login, not just first creation —
// that way, adding an email to SEED_ADMINS upgrades an existing user
// the next time they sign in. Everyone else defaults to 'learner'.
async function loadOrInitUserDoc(uid, email) {
  if (!uid) return { role: ROLES.LEARNER };
  try {
    const ref = doc(db, 'users', uid);
    const snap = await getDoc(ref);
    const shouldBeAdmin = isSeedAdmin(email);
    if (snap.exists()) {
      const data = snap.data();
      const currentRole = normalizeRole(data.role);
      const update = { email, lastActiveAt: serverTimestamp() };
      let nextRole = currentRole;
      if (shouldBeAdmin && currentRole !== ROLES.ADMIN) {
        update.role = ROLES.ADMIN;
        nextRole = ROLES.ADMIN;
      }
      await setDoc(ref, update, { merge: true });
      return { ...data, role: nextRole };
    }
    const initialRole = shouldBeAdmin ? ROLES.ADMIN : ROLES.LEARNER;
    await setDoc(ref, {
      email,
      role: initialRole,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp(),
    });
    return { role: initialRole, email };
  } catch (e) {
    console.error('loadOrInitUserDoc failed', e);
    return { role: ROLES.LEARNER };
  }
}

async function loadCertificate(uid, courseId) {
  if (!uid || !courseId) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid, 'certificates', courseId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('loadCertificate failed', e);
    return null;
  }
}

// Write the cert doc once on first 100% completion. Idempotent: if a cert
// already exists for this user+course, we keep the original issuedAt (the
// rules also forbid update/delete, so any concurrent attempt would just no-op).
async function issueCertificateIfFirstTime(uid, course, score) {
  if (!uid || !course) return;
  try {
    const ref = doc(db, 'users', uid, 'certificates', course.id);
    const existing = await getDoc(ref);
    if (existing.exists()) return;
    const yr = new Date().getFullYear();
    const certCode = course.id.toUpperCase().slice(0, 3);
    await setDoc(ref, {
      certId: `SCA-${certCode}-${yr}`,
      courseTitle: course.title,
      score: score || 0,
      issuedAt: serverTimestamp(),
    });
  } catch (e) {
    console.error('issueCertificateIfFirstTime failed', e);
  }
}

function computeCompletion(course, p = {}) {
  if (!course) return 0;
  const totalSteps = course.lessons.length + 2;
  let done = 0;
  course.lessons.forEach(l => { if (p[`lesson-${l.id}`]) done++; });
  if (p.interactive) done++;
  if (p.quiz) done++;
  return Math.round((done / totalSteps) * 100);
}

function timeAgo(ts) {
  const date = ts?.toDate?.();
  if (!date) return '';
  const s = Math.floor((Date.now() - date.getTime()) / 1000);
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function isAllowedEmail(email) {
  if (!email) return false;
  const trimmed = email.trim().toLowerCase();
  const re = /^[^\s@]+@([^\s@]+)$/;
  const match = trimmed.match(re);
  if (!match) return false;
  return match[1] === ALLOWED_DOMAIN;
}

function friendlyAuthError(err) {
  const code = err?.code || '';
  if (code === 'auth/too-many-requests') return 'Too many attempts. Wait a few minutes before trying again.';
  if (code === 'auth/network-request-failed') return 'Network error. Check your connection and try again.';
  if (code === 'auth/popup-blocked') return 'Sign-in popup was blocked. Allow popups for this site and try again.';
  return err?.message || 'Something went wrong. Please try again.';
}

function nameFromEmail(email) {
  if (!email) return '';
  const local = email.split('@')[0];
  return local
    .split(/[._-]+/)
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
    .join(' ');
}

const GENERAL_TOPIC = { id: '__general__', title: 'General Discussion' };

function threadTopicLabel(thread) {
  if (thread?.courseId) {
    const course = COURSES.find(c => c.id === thread.courseId);
    if (course) return course.title;
  }
  return thread?.category || GENERAL_TOPIC.title;
}

// ===== Main App =====
export default function App() {
  const [page, setPage] = useState('catalog');
  const [view, setView] = useState('list');
  const [activeCourse, setActiveCourse] = useState(null);
  const [certificateCourse, setCertificateCourse] = useState(null);
  const [activeLessonIdx, setActiveLessonIdx] = useState(0);
  const [progress, setProgress] = useState({});
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userUid, setUserUid] = useState('');
  const [userRole, setUserRole] = useState(ROLES.LEARNER);
  const [myAssignments, setMyAssignments] = useState([]);
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user && isAllowedEmail(user.email)) {
        const email = user.email.toLowerCase();
        const uid = user.uid;
        setUserEmail(email);
        setUserUid(uid);
        // Show the app immediately on a derived name. The catalog and courses
        // are static, so they need no network — only per-user data does.
        const derived = user.displayName || nameFromEmail(email);
        if (derived) setUserName(derived);
        setLoaded(true);
        // Hydrate per-user data in the background so Firestore round-trips
        // don't gate the first paint.
        (async () => {
          const [p, storedName, userDoc, asgn] = await Promise.all([
            loadProgress(uid),
            loadUserName(uid),
            loadOrInitUserDoc(uid, email),
            listAssignmentsForUser(uid).catch(() => []),
          ]);
          setProgress(p);
          setUserRole(userDoc.role || ROLES.LEARNER);
          setMyAssignments(asgn);
          if (storedName) {
            setUserName(storedName);
          } else if (derived) {
            saveUserName(uid, derived);
          } else {
            setShowNamePrompt(true);
          }
        })();
      } else {
        setUserEmail('');
        setUserUid('');
        setUserName('');
        setUserRole(ROLES.LEARNER);
        setProgress({});
        setMyAssignments([]);
        setLoaded(true);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.error('Sign-out failed', e);
    }
    setPage('catalog');
    setView('list');
  };

  const updateProgress = (courseId, key, value) => {
    if (!userUid) return;
    const prev = progress[courseId] || {};
    const next = {
      ...progress,
      [courseId]: { ...prev, [key]: value },
    };
    setProgress(next);

    const course = COURSES.find(c => c.id === courseId);
    const prevPct = computeCompletion(course, prev);
    const nextPct = computeCompletion(course, next[courseId]);
    const isFirstWrite = Object.keys(prev).length === 0;
    const justCompleted = course && prevPct < 100 && nextPct === 100;

    saveCourseProgress(userUid, courseId, { [key]: value }, {
      startedAt: isFirstWrite,
      completedAt: justCompleted,
    });

    if (justCompleted) {
      const quizScore = next[courseId].quiz?.score || 0;
      issueCertificateIfFirstTime(userUid, course, quizScore);
    }
  };

  const courseCompletion = (courseId) => {
    const course = COURSES.find(c => c.id === courseId);
    return computeCompletion(course, progress[courseId]);
  };

  // Placeholders (Coming soon) don't count toward completion stats or the Master Certificate.
  const liveCourses = COURSES.filter(c => !c.placeholder);
  const completedCount = liveCourses.filter(c => courseCompletion(c.id) === 100).length;
  const inProgressCount = liveCourses.filter(c => {
    const p = courseCompletion(c.id);
    return p > 0 && p < 100;
  }).length;

  if (!loaded) {
    return <LoadingScreen />;
  }

  if (!userEmail) {
    return <LoginPage />;
  }

  const goToCourse = (course) => {
    setActiveCourse(course);
    setView('course');
    setPage('catalog');
    setSidebarOpen(false);
  };

  const navigate = (newPage) => {
    setPage(newPage);
    setView('list');
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex" style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", sans-serif' }}>
      {showNamePrompt && (
        <NamePrompt
          onSubmit={(name) => {
            setUserName(name);
            saveUserName(userUid, name);
            setShowNamePrompt(false);
          }}
        />
      )}

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-screen w-64 bg-black text-white z-40 transition-transform duration-200 flex flex-col ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <SidebarLogo />
        </div>

        <nav className="px-3 flex-1 overflow-y-auto">
          <SidebarItem icon={BarChart3} label="Dashboard" active={page === 'dashboard'} onClick={() => navigate('dashboard')} />
          <SidebarItem icon={BookMarked} label="Course Catalog" active={page === 'catalog'} onClick={() => navigate('catalog')} />
          <SidebarItem icon={Award} label="My Certificates" active={page === 'certificates'} onClick={() => navigate('certificates')} />
          <SidebarItem icon={MessageSquare} label="Community Forum" active={page === 'forum'} onClick={() => navigate('forum')} />
          {isAdmin(userRole) && (
            <SidebarItem icon={Shield} label="Admin" active={page === 'admin'} onClick={() => navigate('admin')} />
          )}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="text-xs uppercase tracking-widest text-gray-400 font-bold mb-3">Change That Matters</div>
          {userName && (
            <div className="flex items-center gap-3 bg-gray-900 p-3 rounded-lg">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0" style={{ backgroundColor: YELLOW }}>
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-sm truncate">{userName}</div>
                <div className="text-xs text-gray-400 truncate">{userEmail || 'Solidaridad Staff'}</div>
              </div>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="mt-3 w-full text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-white py-2 transition-colors"
          >
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-20">
          <div className="px-4 lg:px-8 py-3 flex items-center gap-4">
            <button className="lg:hidden p-2 hover:bg-gray-100 rounded" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="flex-1 max-w-xl relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses, topics..."
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setPage('catalog'); setView('list'); }}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:bg-white"
                style={{ '--tw-ring-color': YELLOW }}
              />
            </div>
            {isAdmin(userRole) && (
              <button
                onClick={() => navigate('admin')}
                aria-label="Open admin dashboard"
                title="Admin dashboard"
                className={`flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider px-3 py-2 rounded border transition-colors ${
                  page === 'admin'
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-black'
                }`}
              >
                <Shield size={16} />
                <span className="hidden sm:inline">Admin</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 lg:px-8 py-6 lg:py-8 pb-20">
          {view === 'list' && page === 'dashboard' && (
            <DashboardPage
              userName={userName}
              courses={COURSES}
              courseCompletion={courseCompletion}
              completedCount={completedCount}
              inProgressCount={inProgressCount}
              onSelectCourse={goToCourse}
              onGoToCatalog={() => navigate('catalog')}
              assignments={myAssignments}
            />
          )}

          {view === 'list' && page === 'catalog' && (
            <CatalogPage
              courses={COURSES}
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
              searchQuery={searchQuery}
              courseCompletion={courseCompletion}
              onSelectCourse={goToCourse}
            />
          )}

          {view === 'list' && page === 'certificates' && (
            <CertificatesPage
              userName={userName}
              courses={liveCourses}
              courseCompletion={courseCompletion}
              onSelectCourse={goToCourse}
              onViewMaster={() => { setCertificateCourse(null); setView('certificate'); }}
              onViewCourseCertificate={(course) => { setCertificateCourse(course); setView('certificate'); }}
              allComplete={completedCount === liveCourses.length}
            />
          )}

          {view === 'list' && page === 'forum' && (
            <ForumPage userName={userName} userUid={userUid} />
          )}

          {view === 'list' && page === 'admin' && isAdmin(userRole) && (
            <Suspense fallback={<div className="py-16 text-center text-sm text-gray-500">Loading admin dashboard…</div>}>
              <AdminDashboard
                currentRole={userRole}
                currentUid={userUid}
                courses={COURSES}
                computeCompletion={computeCompletion}
              />
            </Suspense>
          )}

          {view === 'course' && activeCourse && (
            <CourseView
              course={activeCourse}
              progress={progress[activeCourse.id] || {}}
              completion={courseCompletion(activeCourse.id)}
              onStartLesson={(idx) => { setActiveLessonIdx(idx); setView('lesson'); }}
              onStartInteractive={() => setView('interactive')}
              onStartQuiz={() => setView('quiz')}
              onBack={() => setView('list')}
            />
          )}

          {view === 'lesson' && activeCourse && (
            <LessonView
              course={activeCourse}
              lessonIdx={activeLessonIdx}
              onComplete={() => {
                const lesson = activeCourse.lessons[activeLessonIdx];
                updateProgress(activeCourse.id, `lesson-${lesson.id}`, true);
                if (activeLessonIdx < activeCourse.lessons.length - 1) {
                  setActiveLessonIdx(activeLessonIdx + 1);
                } else {
                  setView('course');
                }
              }}
              onPrev={() => {
                if (activeLessonIdx > 0) setActiveLessonIdx(activeLessonIdx - 1);
                else setView('course');
              }}
              onBack={() => setView('course')}
            />
          )}

          {view === 'interactive' && activeCourse && (
            <InteractiveView
              course={activeCourse}
              onComplete={() => {
                updateProgress(activeCourse.id, 'interactive', true);
                setView('course');
              }}
              onBack={() => setView('course')}
            />
          )}

          {view === 'quiz' && activeCourse && (
            <QuizView
              course={activeCourse}
              onComplete={(score) => {
                updateProgress(activeCourse.id, 'quiz', { score, completed: true });
                setView('course');
              }}
              onBack={() => setView('course')}
            />
          )}

          {view === 'certificate' && (
            <CertificateView
              userName={userName}
              uid={userUid}
              course={certificateCourse}
              onBack={() => { setView('list'); setPage('certificates'); }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

// ===== Sidebar Item =====
function SidebarItem({ icon: Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-colors mb-1 ${
        active ? 'text-black' : 'text-gray-300 hover:bg-gray-900'
      }`}
      style={active ? { backgroundColor: YELLOW } : {}}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

// ===== Login Page =====
function LoginPage() {
  const [error, setError] = useState('');
  const [blockedAccount, setBlockedAccount] = useState(null);
  const [ssoLoading, setSsoLoading] = useState(false);

  const handleGoogleSSO = async () => {
    setError('');
    setBlockedAccount(null);
    setSsoLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const signedInEmail = (result.user.email || '').toLowerCase();
      if (!isAllowedEmail(signedInEmail)) {
        await signOut(auth);
        setBlockedAccount(signedInEmail || 'this Google account');
      }
    } catch (err) {
      if (err?.code !== 'auth/popup-closed-by-user' && err?.code !== 'auth/cancelled-popup-request') {
        setError(friendlyAuthError(err));
      }
    } finally {
      setSsoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#fafafa' }}>
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-0 right-0 h-44" style={{ backgroundColor: GREY, opacity: 0.35 }} />
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute top-24 left-0 w-full h-64"
        >
          <path
            d="M0 220 Q 360 60, 720 160 T 1440 120"
            stroke={YELLOW}
            strokeWidth="56"
            strokeLinecap="round"
            fill="none"
          />
        </svg>
        <svg
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
          className="absolute bottom-0 left-0 w-full h-40"
        >
          <path
            d="M0 240 Q 360 180, 720 220 T 1440 200"
            stroke={BLACK}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>

      <div className="relative w-full max-w-md">
        <div className="flex justify-center mb-8 px-6 py-4 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="inline-flex items-center gap-3">
            <JifunzeIcon size={56} color={BLACK} accent={YELLOW} />
            <div className="flex flex-col items-start">
              <span className="font-extrabold text-4xl tracking-tight leading-none text-black">Jifunze</span>
              <Swoosh w={120} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-7 md:p-9">
          <div className="text-center mb-6">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight uppercase">Welcome</h1>
            <div className="flex justify-center mt-2">
              <Swoosh w={64} />
            </div>
            <p className="mt-3 text-sm text-gray-600">
              Sign in with your <strong>@{ALLOWED_DOMAIN}</strong> Google Workspace account to continue.
            </p>
          </div>

          {blockedAccount ? (
            <div className="mb-5 rounded-lg border-2 p-4" style={{ borderColor: YELLOW, backgroundColor: '#FFFBEA' }}>
              <div className="flex items-start gap-3">
                <Shield size={20} className="flex-shrink-0 mt-0.5 text-black" />
                <div className="flex-1">
                  <p className="text-sm font-extrabold text-black tracking-tight">Access restricted to Solidaridad staff</p>
                  <p className="mt-1.5 text-xs text-gray-800 leading-relaxed">
                    Jifunze is only available to people with an <strong>@{ALLOWED_DOMAIN}</strong> Google Workspace account.
                  </p>
                  <p className="mt-2 text-xs text-gray-700 leading-relaxed">
                    You signed in with <span className="font-mono font-bold break-all">{blockedAccount}</span>, which isn't a Solidaridad account. You have been signed out.
                  </p>
                  <p className="mt-3 text-xs text-gray-700 leading-relaxed">
                    If you have a Solidaridad account, try again and pick it from the Google chooser. If you believe you should have access, contact{' '}
                    <a href={`mailto:info.secaec@${ALLOWED_DOMAIN}`} className="font-bold underline hover:text-black">
                      info.secaec@{ALLOWED_DOMAIN}
                    </a>.
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <button
              type="button"
              onClick={handleGoogleSSO}
              disabled={ssoLoading}
              className="w-full py-3 font-bold text-sm rounded-lg border-2 border-black hover:bg-gray-50 transition-colors flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {ssoLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Opening Google sign-in…</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  {blockedAccount ? 'Try a different Google account' : 'Continue with Google'}
                </>
              )}
            </button>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg border border-red-200 bg-red-50">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-red-600" />
                <p className="text-xs text-red-800 font-medium">{error}</p>
              </div>
            )}

            <p className="text-[11px] text-center text-gray-500 mt-4">
              By signing in, you agree to Solidaridad's Code of Conduct and Acceptable Use Policy.
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 font-bold tracking-wider">
            CHANGE <span style={{ color: '#9C7A00' }}>THAT MATTERS</span>
          </p>
          <p className="text-[10px] text-gray-400 mt-1">
            © Solidaridad {new Date().getFullYear()} · Need help? <a href={`mailto:info.secaec@${ALLOWED_DOMAIN}`} className="underline hover:text-black">Contact support</a>
          </p>
        </div>
      </div>
    </div>
  );
}

// ===== Name Prompt =====
function NamePrompt({ onSubmit }) {
  const [name, setName] = useState('');
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white max-w-md w-full p-8 border-2 border-black rounded-lg">
        <Logo />
        <h2 className="text-2xl font-extrabold mt-6 mb-1 tracking-tight">WELCOME!</h2>
        <Swoosh />
        <p className="mt-4 text-gray-700">What name should we use on your certificate?</p>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) onSubmit(name.trim()); }}
          placeholder="Your full name"
          className="mt-4 w-full px-4 py-3 border-2 border-black focus:outline-none focus:ring-2 rounded"
          style={{ '--tw-ring-color': YELLOW }}
        />
        <button
          onClick={() => name.trim() && onSubmit(name.trim())}
          disabled={!name.trim()}
          className="mt-4 w-full py-3 font-extrabold tracking-wider disabled:opacity-40 transition-all hover:translate-y-[-1px] rounded"
          style={{ backgroundColor: YELLOW, color: BLACK }}
        >
          START LEARNING →
        </button>
      </div>
    </div>
  );
}

// ===== Dashboard Page =====
function DashboardPage({ userName, courses, courseCompletion, completedCount, inProgressCount, onSelectCourse, onGoToCatalog, assignments = [] }) {
  const inProgressCourses = courses.filter(c => {
    const p = courseCompletion(c.id);
    return p > 0 && p < 100;
  });

  const requiredCourses = assignments
    .map(a => courses.find(c => c.id === a.courseId))
    .filter(c => c && courseCompletion(c.id) < 100);

  const durationToHours = (d) => {
    if (!d) return 0;
    const match = d.match(/(\d+(?:\.\d+)?)/);
    if (!match) return 0;
    const n = parseFloat(match[1]);
    if (/min/i.test(d)) return n / 60;
    if (/hr|hour/i.test(d)) return n;
    return n;
  };

  const learningHours = courses.reduce((sum, c) => {
    const pct = courseCompletion(c.id);
    const hours = durationToHours(c.duration);
    return sum + (hours * pct / 100);
  }, 0);

  const firstName = userName ? userName.split(' ')[0] : 'there';

  return (
    <div>
      <div className="relative bg-black text-white rounded-2xl p-7 md:p-9 overflow-hidden">
        <svg
          viewBox="0 0 200 200"
          className="absolute -right-6 -top-6 w-48 h-48 md:w-64 md:h-64 opacity-20"
          fill="none"
          stroke={YELLOW}
          strokeWidth="3"
        >
          <path d="M100 30 Q 160 60, 160 130 Q 160 170, 100 170 Q 40 170, 40 130 Q 40 60, 100 30 Z" strokeLinejoin="round" />
          <path d="M100 30 L 100 170" strokeLinecap="round" />
          <path d="M100 70 Q 130 80, 145 110" strokeLinecap="round" fill="none" />
          <path d="M100 90 Q 130 100, 145 130" strokeLinecap="round" fill="none" />
          <path d="M100 110 Q 130 120, 140 145" strokeLinecap="round" fill="none" />
          <path d="M100 70 Q 70 80, 55 110" strokeLinecap="round" fill="none" />
          <path d="M100 90 Q 70 100, 55 130" strokeLinecap="round" fill="none" />
          <path d="M100 110 Q 70 120, 60 145" strokeLinecap="round" fill="none" />
        </svg>

        <div className="relative max-w-2xl">
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Karibu, {firstName}!
          </h1>
          <p className="mt-3 text-sm md:text-base text-gray-300 leading-relaxed">
            Welcome to the Solidaridad ECA Learning Platform. Start your learning journey by exploring the tracks below and discovering the knowledge, skills, and insights that support our work and impact.
          </p>
          <button
            onClick={onGoToCatalog}
            className="mt-5 px-5 py-3 font-extrabold uppercase tracking-wider text-sm rounded-lg hover:translate-y-[-1px] transition-all inline-flex items-center gap-2"
            style={{ backgroundColor: YELLOW, color: BLACK }}
          >
            View New Courses
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:gap-4">
        <DashStatCard icon={BookOpen} label="Courses in Progress" value={inProgressCount} />
        <DashStatCard icon={Clock} label="Learning Hours" value={learningHours.toFixed(1)} />
        <DashStatCard icon={Award} label="Certificates Earned" value={completedCount} />
      </div>

      {requiredCourses.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Required For You</h2>
              <p className="text-sm text-gray-600">Assigned by your admin — please complete.</p>
            </div>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {requiredCourses.map(course => (
              <CourseCard key={course.id} course={course} progress={courseCompletion(course.id)} onClick={() => onSelectCourse(course)} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Continue Learning</h2>
          <button onClick={onGoToCatalog} className="text-sm font-bold text-gray-600 hover:text-black inline-flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        {inProgressCourses.length === 0 ? (
          <div className="p-10 border-2 border-dashed border-gray-300 text-center rounded-2xl bg-white">
            <BookOpen size={36} className="mx-auto text-gray-400" />
            <p className="mt-3 text-gray-600 font-medium">No courses in progress yet.</p>
            <button onClick={onGoToCatalog} className="mt-4 px-5 py-2.5 font-extrabold uppercase tracking-wider text-sm rounded-lg" style={{ backgroundColor: YELLOW }}>
              Browse Catalog →
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {inProgressCourses.slice(0, 3).map(course => (
              <ContinueLearningCard
                key={course.id}
                course={course}
                progress={courseCompletion(course.id)}
                onClick={() => onSelectCourse(course)}
              />
            ))}
          </div>
        )}
      </div>

      {courses.filter(c => !c.placeholder && courseCompletion(c.id) === 0).length > 0 && (
        <div className="mt-10">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl md:text-2xl font-extrabold tracking-tight">Recommended For You</h2>
            <button onClick={onGoToCatalog} className="text-sm font-bold text-gray-600 hover:text-black inline-flex items-center gap-1">
              View All <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.filter(c => !c.placeholder && courseCompletion(c.id) === 0).slice(0, 3).map(course => (
              <CourseCard key={course.id} course={course} progress={0} onClick={() => onSelectCourse(course)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DashStatCard({ icon: Icon, label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
      <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-xl flex-shrink-0" style={{ backgroundColor: '#F9F5E8' }}>
        <Icon size={20} className="sm:hidden" style={{ color: '#9C7A00' }} />
        <Icon size={22} className="hidden sm:block" style={{ color: '#9C7A00' }} />
      </div>
      <div className="min-w-0">
        <div className="text-[10px] sm:text-xs uppercase tracking-wider text-gray-500 font-bold leading-tight">{label}</div>
        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight mt-0.5">{value}</div>
      </div>
    </div>
  );
}

function ContinueLearningCard({ course, progress, onClick }) {
  const Icon = course.icon;
  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-md hover:border-gray-300 transition-all flex"
    >
      <div className="relative w-32 sm:w-44 flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
        <Icon size={42} strokeWidth={1.5} className="text-black opacity-90" />
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black text-white text-[10px] font-extrabold uppercase tracking-wider rounded">
          {course.category}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-5 min-w-0">
        <h3 className="font-extrabold tracking-tight leading-snug truncate">{course.title}</h3>
        <div className="mt-1.5 flex items-center gap-3 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1">
            <Layers size={12} /> {course.lessons.length} Modules
          </span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={12} /> {course.duration}
          </span>
        </div>

        <div className="mt-3 sm:mt-4">
          <div className="flex items-center justify-between text-xs font-bold mb-1.5">
            <span className="text-gray-600">Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full transition-all duration-500" style={{ width: `${progress}%`, backgroundColor: YELLOW }} />
          </div>
        </div>
      </div>
    </button>
  );
}

// ===== Catalog Page =====
function CatalogPage({ courses, activeCategory, setActiveCategory, searchQuery, courseCompletion, onSelectCourse }) {
  // `activeCategory` is reused as the active cluster name ('All' or a CLUSTERS[].name).
  const q = (searchQuery || '').toLowerCase();
  const matchesSearch = (c) =>
    !q ||
    c.title.toLowerCase().includes(q) ||
    c.description.toLowerCase().includes(q) ||
    c.category.toLowerCase().includes(q);

  const courseById = Object.fromEntries(courses.map(c => [c.id, c]));
  const clustersToShow = CLUSTERS.filter(cl => activeCategory === 'All' || cl.name === activeCategory);

  const sections = clustersToShow.map(cluster => ({
    ...cluster,
    courses: cluster.courseIds
      .map(id => courseById[id])
      .filter(Boolean)
      .filter(matchesSearch),
  })).filter(s => s.courses.length > 0);

  const clusterPills = ['All', ...CLUSTERS.map(c => c.name)];

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Course Catalog</h1>
      <p className="mt-3 text-gray-600 max-w-3xl">Explore our comprehensive library of courses designed to get you up to speed with Solidaridad's operations, tools, and methodologies in East & Central Africa.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        {clusterPills.map(name => (
          <button
            key={name}
            onClick={() => setActiveCategory(name)}
            className={`px-4 py-1.5 rounded-full text-sm font-bold border transition-all ${
              activeCategory === name
                ? 'bg-black text-white border-black'
                : 'bg-white text-black border-gray-300 hover:border-black'
            }`}
          >
            {name}
          </button>
        ))}
      </div>

      {sections.length === 0 ? (
        <div className="mt-12 p-12 text-center border-2 border-dashed border-gray-300 rounded">
          <Search size={32} className="mx-auto text-gray-400" />
          <p className="mt-3 text-gray-600">No courses match your filters.</p>
        </div>
      ) : (
        <div className="mt-10 space-y-12">
          {sections.map(section => (
            <section key={section.name}>
              <div className="flex items-baseline justify-between flex-wrap gap-x-4 gap-y-1">
                <h2 className="text-xl md:text-2xl font-extrabold tracking-tight uppercase">{section.name}</h2>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.courses.filter(c => !c.placeholder).length} live · {section.courses.filter(c => c.placeholder).length} coming soon
                </span>
              </div>
              <Swoosh w={96} />
              {section.blurb ? (
                <p className="mt-3 text-sm text-gray-600 max-w-3xl">{section.blurb}</p>
              ) : null}
              <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {section.courses.map(course => (
                  <CourseCard
                    key={course.id}
                    course={course}
                    progress={courseCompletion(course.id)}
                    onClick={() => onSelectCourse(course)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Course Card =====
function CourseCard({ course, progress, onClick }) {
  const Icon = course.icon;
  const done = progress === 100;

  if (course.placeholder) {
    return (
      <div
        aria-disabled="true"
        className="text-left bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col cursor-not-allowed opacity-90"
      >
        <div className="relative h-44 flex items-center justify-center" style={{ backgroundColor: GREY }}>
          <Icon size={72} strokeWidth={1.5} className="text-black opacity-60" />
          <div className="absolute top-3 left-3 px-2.5 py-1 bg-white text-xs font-extrabold uppercase tracking-wider rounded-full border border-black inline-flex items-center gap-1.5">
            <Lock size={11} strokeWidth={2.5} />
            Coming soon
          </div>
        </div>
        <div className="p-5 flex flex-col flex-1">
          <h3 className="font-extrabold text-lg tracking-tight leading-snug">{course.title}</h3>
          <p className="mt-2 text-sm text-gray-600 line-clamp-3 flex-1">{course.description}</p>
          <div className="mt-4 w-full py-3 font-extrabold tracking-wider text-sm rounded text-center bg-gray-100 text-gray-500">
            In development
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className="text-left bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col group"
    >
      <div className="relative h-44 flex items-center justify-center" style={{ backgroundColor: YELLOW }}>
        <Icon size={72} strokeWidth={1.5} className="text-black opacity-90" />
        <div className="absolute top-3 left-3 px-2.5 py-1 bg-white text-xs font-extrabold uppercase tracking-wider rounded-full border border-black">
          {course.category}
        </div>
        <svg width="60" height="8" viewBox="0 0 60 8" className="absolute bottom-4 right-4 opacity-40">
          <path d="M2 5 Q 30 1, 58 4" stroke="black" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      </div>

      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-extrabold text-lg tracking-tight leading-snug">{course.title}</h3>
        <p className="mt-2 text-sm text-gray-600 line-clamp-2 flex-1">{course.description}</p>

        <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1.5">
            <Clock size={14} /> {course.duration}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Layers size={14} /> {course.lessons.length} Modules
          </span>
        </div>

        {progress > 0 && progress < 100 && (
          <div className="mt-3">
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full transition-all" style={{ width: `${progress}%`, backgroundColor: YELLOW }} />
            </div>
            <div className="text-xs mt-1 font-bold text-gray-600">{progress}% complete</div>
          </div>
        )}

        <div className={`mt-4 w-full py-3 font-extrabold tracking-wider text-sm rounded text-center transition-colors ${
          done ? 'border-2 border-black text-black hover:bg-gray-50' : 'text-black hover:opacity-90'
        }`} style={!done ? { backgroundColor: YELLOW } : {}}>
          {done ? 'Review Course' : progress > 0 ? 'Continue Course' : 'Start Course'}
        </div>
      </div>
    </button>
  );
}

// ===== Certificates Page =====
function CertificatesPage({ userName, courses, courseCompletion, onSelectCourse, onViewMaster, onViewCourseCertificate, allComplete }) {
  const earned = courses.filter(c => courseCompletion(c.id) === 100);
  const inProgress = courses.filter(c => {
    const p = courseCompletion(c.id);
    return p > 0 && p < 100;
  });

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">My Certificates</h1>
      <p className="mt-3 text-gray-600 max-w-2xl">Every course you complete earns you a certificate. Complete all courses to unlock the Master Certificate.</p>

      <div className="mt-8 p-6 border-2 border-black rounded-lg flex flex-col sm:flex-row items-center gap-5" style={{ backgroundColor: allComplete ? YELLOW : GREY }}>
        <Trophy size={48} className="flex-shrink-0" />
        <div className="flex-1 text-center sm:text-left">
          <div className="text-xs uppercase tracking-widest font-bold">Master Certificate</div>
          <div className="text-xl font-extrabold tracking-tight mt-1">
            {allComplete ? 'You have completed every course!' : `Complete all ${courses.length} courses to unlock`}
          </div>
          {!allComplete && (
            <div className="text-sm mt-1">{earned.length} of {courses.length} earned · {courses.length - earned.length} to go</div>
          )}
        </div>
        {allComplete && (
          <button onClick={onViewMaster} className="px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider text-sm rounded">
            View Certificate →
          </button>
        )}
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-extrabold tracking-tight uppercase">Earned ({earned.length})</h2>
        <Swoosh w={80} />
        {earned.length === 0 ? (
          <div className="mt-6 p-8 border-2 border-dashed border-gray-300 text-center rounded">
            <Award size={32} className="mx-auto text-gray-400" />
            <p className="mt-3 text-gray-600">No certificates earned yet. Complete a course to start your collection.</p>
          </div>
        ) : (
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {earned.map(course => (
              <div key={course.id} className="border-2 border-black bg-white rounded-lg overflow-hidden">
                <div className="p-5 relative" style={{ backgroundColor: YELLOW }}>
                  <Award size={28} />
                  <div className="text-xs uppercase tracking-widest font-bold mt-2">Certificate of Completion</div>
                </div>
                <div className="p-5">
                  <h3 className="font-extrabold tracking-tight leading-snug">{course.title}</h3>
                  <div className="mt-2 text-xs text-gray-500">{course.category}</div>
                  <p className="mt-3 text-sm">Awarded to <span className="font-bold">{userName || 'You'}</span></p>
                  <div className="mt-3 flex gap-3">
                    <button onClick={() => onViewCourseCertificate(course)} className="text-sm font-bold inline-flex items-center gap-1 hover:underline">
                      View certificate <ArrowRight size={14} />
                    </button>
                    <button onClick={() => onSelectCourse(course)} className="text-sm text-gray-500 hover:text-black inline-flex items-center gap-1">
                      Review course
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {inProgress.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-extrabold tracking-tight uppercase">In Progress ({inProgress.length})</h2>
          <Swoosh w={80} />
          <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {inProgress.map(course => (
              <CourseCard key={course.id} course={course} progress={courseCompletion(course.id)} onClick={() => onSelectCourse(course)} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== Forum Page =====
function ForumPage({ userName, userUid }) {
  const [threads, setThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'forum'), orderBy('lastReplyAt', 'desc'), limit(50));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setThreads(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingThreads(false);
      },
      (err) => {
        console.error('forum subscribe failed', err);
        setLoadingThreads(false);
      },
    );
    return unsub;
  }, []);

  if (selected) {
    return (
      <ThreadDetail
        thread={selected}
        userName={userName}
        userUid={userUid}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">Community Forum</h1>
      <p className="mt-3 text-gray-600 max-w-2xl">Connect with colleagues across Ethiopia, Kenya, Tanzania, and Uganda. Share experiences, ask questions, and learn from peers.</p>

      <div className="mt-6 flex items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          {loadingThreads ? 'Loading…' : `${threads.length} active discussion${threads.length === 1 ? '' : 's'}`}
        </div>
        <button
          onClick={() => setShowNew(true)}
          disabled={!userUid}
          className="px-5 py-2.5 font-extrabold uppercase tracking-wider text-sm rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: YELLOW }}
        >
          <MessageSquare size={16} /> New Discussion
        </button>
      </div>

      {showNew && (
        <NewThreadModal
          userName={userName}
          userUid={userUid}
          onClose={() => setShowNew(false)}
        />
      )}

      <div className="mt-6 space-y-3">
        {!loadingThreads && threads.length === 0 && (
          <div className="p-8 border-2 border-dashed border-gray-300 text-center rounded">
            <MessageSquare size={32} className="mx-auto text-gray-400" />
            <p className="mt-3 text-gray-600">No discussions yet — start the first one.</p>
          </div>
        )}
        {threads.map(t => (
          <button
            key={t.id}
            onClick={() => setSelected(t)}
            className="w-full text-left bg-white border border-gray-200 rounded-lg p-5 hover:border-black hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0" style={{ backgroundColor: YELLOW }}>
                {(t.authorName || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 border border-black rounded-full">{threadTopicLabel(t)}</span>
                  <span className="text-xs text-gray-500">{timeAgo(t.lastReplyAt || t.createdAt)}</span>
                </div>
                <h3 className="font-extrabold tracking-tight mt-2 leading-snug">{t.title}</h3>
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500">
                  <span>{t.authorName || 'Anonymous'}{t.country ? ` · ${t.country}` : ''}</span>
                  <span className="inline-flex items-center gap-1">
                    <MessageSquare size={12} /> {t.replyCount || 0} {t.replyCount === 1 ? 'reply' : 'replies'}
                  </span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-5 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="text-xs uppercase tracking-widest font-bold">Forum Guidelines</div>
        <p className="mt-2 text-sm text-gray-700">Be respectful, use UN/Oxford English, share field experiences, and protect confidential information per our Code of Conduct.</p>
      </div>
    </div>
  );
}

function NewThreadModal({ userName, userUid, onClose }) {
  const topicOptions = [GENERAL_TOPIC, ...COURSES.map(c => ({ id: c.id, title: c.title }))];
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [topicId, setTopicId] = useState(GENERAL_TOPIC.id);
  const [country, setCountry] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!title.trim() || !body.trim()) {
      setError('Title and body are required.');
      return;
    }
    if (!userUid) {
      setError('You need to be signed in to post.');
      return;
    }
    setSubmitting(true);
    try {
      const isGeneral = topicId === GENERAL_TOPIC.id;
      const selectedCourse = isGeneral ? null : COURSES.find(c => c.id === topicId);
      const topicLabel = selectedCourse ? selectedCourse.title : GENERAL_TOPIC.title;
      await addDoc(collection(db, 'forum'), {
        title: title.trim(),
        body: body.trim(),
        courseId: selectedCourse ? selectedCourse.id : null,
        category: topicLabel,
        authorUid: userUid,
        authorName: userName || 'Anonymous',
        country: country.trim(),
        createdAt: serverTimestamp(),
        lastReplyAt: serverTimestamp(),
        replyCount: 0,
      });
      onClose();
    } catch (e) {
      console.error('addDoc forum failed', e);
      setError('Could not post. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white max-w-xl w-full rounded-lg p-6 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold tracking-tight uppercase">New Discussion</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <Swoosh w={120} />

        <div className="mt-4 space-y-3">
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
            maxLength={140}
          />
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600">Topic</label>
          <select
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black bg-white -mt-2"
          >
            {topicOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.title}</option>)}
          </select>
          <input
            type="text"
            value={country}
            onChange={e => setCountry(e.target.value)}
            placeholder="Your country (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
            maxLength={60}
          />
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Share your question, experience, or insight…"
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black resize-y"
            maxLength={4000}
          />
          {error && <div className="text-sm text-red-600">{error}</div>}
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold uppercase tracking-wider hover:underline"
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="px-5 py-2.5 font-extrabold uppercase tracking-wider text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW }}
          >
            {submitting ? 'Posting…' : 'Post Discussion'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ThreadDetail({ thread, userName, userUid, onBack }) {
  const [replies, setReplies] = useState([]);
  const [loadingReplies, setLoadingReplies] = useState(true);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'forum', thread.id, 'replies'), orderBy('createdAt', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setReplies(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        setLoadingReplies(false);
      },
      (err) => {
        console.error('replies subscribe failed', err);
        setLoadingReplies(false);
      },
    );
    return unsub;
  }, [thread.id]);

  const post = async () => {
    setError('');
    if (!body.trim() || !userUid) return;
    setSubmitting(true);
    try {
      const batch = writeBatch(db);
      const replyRef = doc(collection(db, 'forum', thread.id, 'replies'));
      batch.set(replyRef, {
        body: body.trim(),
        authorUid: userUid,
        authorName: userName || 'Anonymous',
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'forum', thread.id), {
        replyCount: increment(1),
        lastReplyAt: serverTimestamp(),
      });
      await batch.commit();
      setBody('');
    } catch (e) {
      console.error('post reply failed', e);
      setError('Could not post reply. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> Back to Forum
      </button>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 border border-black rounded-full">{threadTopicLabel(thread)}</span>
          <span className="text-xs text-gray-500">{timeAgo(thread.createdAt)}</span>
        </div>
        <h1 className="mt-3 text-2xl md:text-3xl font-extrabold tracking-tight leading-tight">{thread.title}</h1>
        <div className="mt-2 text-sm text-gray-600">
          {thread.authorName || 'Anonymous'}{thread.country ? ` · ${thread.country}` : ''}
        </div>
        <p className="mt-4 whitespace-pre-wrap text-gray-800">{thread.body}</p>
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-extrabold tracking-tight uppercase">
          Replies ({thread.replyCount || replies.length})
        </h2>
        <Swoosh w={80} />

        <div className="mt-4 space-y-3">
          {loadingReplies && <div className="text-sm text-gray-500">Loading replies…</div>}
          {!loadingReplies && replies.length === 0 && (
            <div className="text-sm text-gray-500">No replies yet — be the first.</div>
          )}
          {replies.map(r => (
            <div key={r.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-black flex-shrink-0 text-sm" style={{ backgroundColor: YELLOW }}>
                  {(r.authorName || '?').charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-500">
                    <span className="font-bold text-black">{r.authorName || 'Anonymous'}</span> · {timeAgo(r.createdAt)}
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-gray-800">{r.body}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 bg-white border border-gray-200 rounded-lg p-4">
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder={userUid ? 'Write a reply…' : 'Sign in to reply.'}
          rows={3}
          disabled={!userUid || submitting}
          className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black resize-y disabled:bg-gray-50"
          maxLength={4000}
        />
        {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        <div className="mt-3 flex justify-end">
          <button
            onClick={post}
            disabled={!userUid || submitting || !body.trim()}
            className="px-5 py-2.5 font-extrabold uppercase tracking-wider text-sm rounded disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: YELLOW }}
          >
            {submitting ? 'Posting…' : 'Post Reply'}
          </button>
        </div>
      </div>
    </div>
  );
}


// ===== Course View =====
function CourseView({ course, progress, completion, onStartLesson, onStartInteractive, onStartQuiz, onBack }) {
  const Icon = course.icon;
  return (
    <div>
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> All Courses
      </button>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-72 flex-shrink-0 flex items-center justify-center p-12" style={{ backgroundColor: YELLOW }}>
            <Icon size={96} strokeWidth={1.5} />
          </div>
          <div className="p-6 md:p-8 flex-1">
            <div className="inline-block px-3 py-1 text-xs uppercase tracking-widest font-extrabold border border-black rounded-full">
              {course.category}
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-3">{course.title}</h1>
            <Swoosh w={180} />
            <p className="mt-3 text-gray-700">{course.description}</p>

            <div className="mt-5 flex items-center gap-5 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5"><Clock size={15} /> {course.duration}</span>
              <span className="inline-flex items-center gap-1.5"><Layers size={15} /> {course.lessons.length} Lessons</span>
            </div>

            <div className="mt-4 inline-flex items-center gap-3 px-4 py-2 border border-gray-200 rounded-full text-sm font-bold bg-gray-50">
              <span>{completion}% complete</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full" style={{ width: `${completion}%`, backgroundColor: YELLOW }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-extrabold tracking-tight uppercase">Lessons</h2>
        <Swoosh w={80} />
        <div className="mt-4 space-y-2">
          {course.lessons.map((lesson, idx) => {
            const done = progress[`lesson-${lesson.id}`];
            return (
              <button
                key={lesson.id}
                onClick={() => onStartLesson(idx)}
                className="w-full text-left flex items-center gap-4 p-4 bg-white border border-gray-200 hover:border-black rounded-lg transition-colors"
              >
                <div className="w-9 h-9 flex items-center justify-center font-extrabold text-sm rounded-full" style={{ backgroundColor: done ? YELLOW : GREY }}>
                  {done ? <Check size={16} /> : idx + 1}
                </div>
                <div className="flex-1">
                  <div className="font-bold">{lesson.title}</div>
                </div>
                <ChevronRight size={18} />
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <button
          onClick={onStartInteractive}
          className="p-5 bg-white border border-gray-200 hover:border-black rounded-lg text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <Sparkles size={24} style={{ color: YELLOW }} />
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Hands-on activity</div>
              <div className="font-extrabold uppercase tracking-tight">Interactive</div>
            </div>
            {progress.interactive && <CheckCircle2 size={20} className="ml-auto" style={{ color: '#16a34a' }} />}
          </div>
          <p className="mt-3 text-sm text-gray-700">{course.interactive.title}</p>
        </button>
        <button
          onClick={onStartQuiz}
          className="p-5 bg-white border border-gray-200 hover:border-black rounded-lg text-left transition-all"
        >
          <div className="flex items-center gap-3">
            <Trophy size={24} style={{ color: YELLOW }} />
            <div>
              <div className="text-xs uppercase tracking-widest text-gray-500">Test yourself</div>
              <div className="font-extrabold uppercase tracking-tight">Final Quiz</div>
            </div>
            {progress.quiz && <CheckCircle2 size={20} className="ml-auto" style={{ color: '#16a34a' }} />}
          </div>
          <p className="mt-3 text-sm text-gray-700">{course.quiz.length} questions {progress.quiz ? `· Score: ${progress.quiz.score}/${course.quiz.length}` : ''}</p>
        </button>
      </div>
    </div>
  );
}

// ===== Lesson View =====
function LessonView({ course, lessonIdx, onComplete, onPrev, onBack }) {
  const lesson = course.lessons[lessonIdx];
  const isLast = lessonIdx === course.lessons.length - 1;

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> Back to {course.title}
      </button>
      <p className="text-sm uppercase tracking-widest text-gray-500">Lesson {lessonIdx + 1} of {course.lessons.length}</p>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase mt-1">{lesson.title}</h1>
      <Swoosh w={180} />

      <div className="flex gap-1.5 mt-4">
        {course.lessons.map((_, i) => (
          <div key={i} className="h-1 flex-1 max-w-12 rounded-full" style={{ backgroundColor: i <= lessonIdx ? YELLOW : GREY }} />
        ))}
      </div>

      <div className="mt-8 space-y-5">
        {lesson.content.map((block, i) => <ContentBlock key={i} block={block} />)}
      </div>

      <div className="mt-12 flex items-center justify-between">
        <button onClick={onPrev} className="px-5 py-3 border-2 border-black font-bold uppercase tracking-wider hover:bg-gray-50 inline-flex items-center gap-2 rounded">
          <ChevronLeft size={16} /> Previous
        </button>
        <button onClick={onComplete} className="px-6 py-3 font-extrabold uppercase tracking-wider inline-flex items-center gap-2 hover:translate-y-[-1px] transition-all rounded" style={{ backgroundColor: YELLOW, color: BLACK }}>
          {isLast ? 'Complete Lesson' : 'Next Lesson'} <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

function ContentBlock({ block }) {
  switch (block.type) {
    case 'p':
      return <p className="text-lg leading-relaxed text-gray-800">{block.text}</p>;
    case 'h':
      return (
        <div>
          <h3 className="text-2xl font-extrabold uppercase tracking-tight">{block.text}</h3>
          <Swoosh w={80} />
        </div>
      );
    case 'callout':
      return (
        <div className="border-l-4 p-5 bg-gray-50 rounded-r" style={{ borderColor: YELLOW }}>
          <div className="flex gap-3">
            <Lightbulb size={22} style={{ color: YELLOW }} className="flex-shrink-0 mt-0.5" />
            <p className="text-gray-800 italic">{block.text}</p>
          </div>
        </div>
      );
    case 'highlight':
      return (
        <div className="text-xl md:text-2xl font-extrabold leading-snug">
          {block.text.split(' ').map((word, i) => (
            <span key={i} className="inline-block mr-2" style={{ backgroundColor: i % 2 === 0 ? YELLOW : 'transparent', padding: i % 2 === 0 ? '0 6px' : '0' }}>{word}</span>
          ))}
        </div>
      );
    case 'list':
      return (
        <ul className="space-y-2">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-3 text-lg">
              <span className="w-2 h-2 mt-2.5 flex-shrink-0" style={{ backgroundColor: YELLOW }} />
              <span className="text-gray-800">{item}</span>
            </li>
          ))}
        </ul>
      );
    case 'value':
      return (
        <div className="border-2 border-black p-5 rounded">
          <div className="text-2xl font-extrabold tracking-tight">
            <span style={{ color: YELLOW }}>{block.title.charAt(0)}</span>
            <span>{block.title.slice(1)}</span>
          </div>
          <p className="mt-2 text-gray-800">{block.text}</p>
        </div>
      );
    case 'pillar':
    case 'pathway':
    case 'strategy':
      return (
        <div className="flex gap-4 p-4 border border-gray-200 bg-white rounded">
          <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-extrabold rounded" style={{ backgroundColor: YELLOW }}>
            {block.title.charAt(0)}
          </div>
          <div>
            <div className="font-extrabold uppercase tracking-tight">{block.title}</div>
            <p className="text-gray-700 text-sm mt-1">{block.text}</p>
          </div>
        </div>
      );
    case 'cluster':
      return (
        <div className="p-4 border border-gray-200 rounded">
          <div className="font-extrabold uppercase text-sm tracking-wider">{block.title}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {block.items.map((item, i) => (
              <span key={i} className="px-3 py-1 text-sm font-bold rounded" style={{ backgroundColor: YELLOW }}>{item}</span>
            ))}
          </div>
        </div>
      );
    case 'colour':
      return (
        <div className="flex items-center gap-4 p-4 border border-gray-200 rounded">
          <div className="w-16 h-16 border border-black flex-shrink-0 rounded" style={{ backgroundColor: block.hex }} />
          <div>
            <div className="font-extrabold text-xl tracking-tight">{block.name}</div>
            <div className="text-sm text-gray-600 font-mono">{block.hex} · {block.code}</div>
          </div>
        </div>
      );
    case 'ambition':
      return (
        <div className="flex gap-4 p-5 border border-gray-200 rounded">
          <div className="flex-shrink-0 px-4 py-3 flex flex-col items-center justify-center min-w-28 rounded" style={{ backgroundColor: YELLOW }}>
            <div className="text-2xl font-extrabold tracking-tight">{block.number}</div>
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-widest font-extrabold">{block.label}</div>
            <p className="mt-1 text-gray-700">{block.text}</p>
          </div>
        </div>
      );
    case 'country':
      return (
        <div className="p-4 border border-gray-200 rounded">
          <div className="flex items-center gap-2 mb-2">
            <MapPin size={18} style={{ color: YELLOW }} />
            <div className="font-extrabold uppercase tracking-tight">{block.name}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            {block.commodities.map((c, i) => (
              <span key={i} className="px-2.5 py-1 text-xs font-bold border border-gray-300 rounded-full" style={{ backgroundColor: i % 2 === 0 ? YELLOW : 'white' }}>{c}</span>
            ))}
          </div>
        </div>
      );
    case 'stat':
      return (
        <div className="flex items-center gap-4 p-4 border border-gray-200 bg-white rounded">
          <div className="text-3xl font-extrabold tracking-tight">{block.number}</div>
          <div className="flex-1">
            <div className="font-extrabold uppercase tracking-tight">{block.label}</div>
            <div className="text-xs text-gray-600 mt-0.5">{block.detail}</div>
          </div>
        </div>
      );
    case 'outcome':
      return (
        <div className="p-5 border-2 border-black rounded bg-white">
          <div className="font-extrabold tracking-tight uppercase">{block.title}</div>
          <Swoosh w={60} />
          <ul className="mt-3 space-y-1.5">
            {block.kpis.map((k, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="w-1.5 h-1.5 mt-2 flex-shrink-0 rounded-full" style={{ backgroundColor: YELLOW }} />
                <span className="text-gray-800">{k}</span>
              </li>
            ))}
          </ul>
        </div>
      );
    case 'finance':
      return (
        <div className="flex items-center gap-4 p-3 border border-gray-200 rounded bg-white">
          <div className="text-xs uppercase tracking-widest font-extrabold px-2 py-0.5 rounded" style={{ backgroundColor: YELLOW }}>{block.year}</div>
          <div className="text-xl font-extrabold tracking-tight">{block.amount}</div>
        </div>
      );
    default:
      return null;
  }
}

// ===== Interactive View =====
function InteractiveView({ course, onComplete, onBack }) {
  const interactive = course.interactive;

  return (
    <div>
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> Back to {course.title}
      </button>
      <p className="text-sm uppercase tracking-widest text-gray-500">Interactive</p>
      <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight uppercase mt-1">{interactive.title}</h1>
      <Swoosh w={200} />

      <div className="mt-8">
        {interactive.type === 'match-value' && <MatchValueGame data={interactive.pairs} onComplete={onComplete} />}
        {interactive.type === 'spelling-sort' && <SpellingSort data={interactive.pairs} onComplete={onComplete} />}
        {interactive.type === 'scenario' && <ScenarioGame data={interactive.scenarios} onComplete={onComplete} />}
        {interactive.type === 'country-commodity' && <CountryCommodityGame data={interactive} onComplete={onComplete} />}
      </div>
    </div>
  );
}

// ===== Match Value Game =====
function MatchValueGame({ data, onComplete }) {
  const [matched, setMatched] = useState({});
  const [selectedValue, setSelectedValue] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const values = [...new Set(data.map(p => p.value))];
  const behaviours = data.map(p => p.behaviour);

  const handleBehaviourClick = (behaviour) => {
    if (!selectedValue) return;
    const correct = data.find(p => p.behaviour === behaviour && p.value === selectedValue);
    if (correct) {
      setMatched({ ...matched, [behaviour]: selectedValue });
      setFeedback({ type: 'correct', msg: 'Correct match!' });
      setSelectedValue(null);
    } else {
      setFeedback({ type: 'wrong', msg: 'Not quite — try another.' });
    }
    setTimeout(() => setFeedback(null), 1500);
  };

  const allMatched = Object.keys(matched).length === data.length;

  return (
    <div className="max-w-3xl">
      <p className="text-gray-700 mb-6">Tap an item from the top row, then tap the matching item below.</p>

      <div className="mb-6">
        <div className="text-xs font-extrabold uppercase tracking-widest mb-2">Concepts</div>
        <div className="flex flex-wrap gap-2">
          {values.map(v => {
            const usedCount = Object.values(matched).filter(m => m === v).length;
            const isDone = usedCount >= data.filter(p => p.value === v).length;
            return (
              <button
                key={v}
                disabled={isDone}
                onClick={() => setSelectedValue(v)}
                className={`px-4 py-2 font-extrabold text-sm border-2 border-black rounded transition-all ${selectedValue === v ? '' : isDone ? 'opacity-30' : 'hover:translate-y-[-1px]'}`}
                style={{ backgroundColor: selectedValue === v ? YELLOW : isDone ? GREY : 'white' }}
              >
                {v} {isDone && '✓'}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="text-xs font-extrabold uppercase tracking-widest mb-2">Match to</div>
        <div className="space-y-2">
          {behaviours.map(b => (
            <button
              key={b}
              onClick={() => handleBehaviourClick(b)}
              disabled={!!matched[b]}
              className={`w-full text-left p-4 border-2 border-black rounded transition-colors ${matched[b] ? 'opacity-60' : 'hover:bg-gray-50'}`}
              style={{ backgroundColor: matched[b] ? GREY : 'white' }}
            >
              <div className="flex items-start justify-between gap-3">
                <span>{b}</span>
                {matched[b] && <span className="text-xs font-extrabold whitespace-nowrap px-2 py-1 rounded" style={{ backgroundColor: YELLOW }}>{matched[b]}</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div className={`mt-4 p-3 font-bold rounded ${feedback.type === 'correct' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {feedback.msg}
        </div>
      )}

      {allMatched && (
        <div className="mt-8 p-6 text-center border-2 border-black rounded" style={{ backgroundColor: YELLOW }}>
          <Trophy size={32} className="mx-auto" />
          <p className="font-extrabold text-xl mt-2 uppercase">All matched!</p>
          <button onClick={onComplete} className="mt-4 px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider rounded">
            Continue →
          </button>
        </div>
      )}
    </div>
  );
}

// ===== Spelling Sort =====
function SpellingSort({ data, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [answer, setAnswer] = useState(null);
  const [showResult, setShowResult] = useState(false);

  const current = data[idx];
  const options = React.useMemo(() => {
    const arr = [current.correct, current.incorrect];
    return idx % 2 === 0 ? arr : arr.reverse();
  }, [idx, current]);

  const handlePick = (choice) => {
    if (showResult) return;
    setAnswer(choice);
    setShowResult(true);
    if (choice === current.correct) setScore(score + 1);
  };

  const next = () => {
    if (idx < data.length - 1) {
      setIdx(idx + 1);
      setAnswer(null);
      setShowResult(false);
    }
  };

  const done = idx === data.length - 1 && showResult;

  return (
    <div className="max-w-2xl">
      <p className="text-gray-700 mb-2">Which is the correct/recommended choice?</p>
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-6">Question {idx + 1} of {data.length} · Score: {score}</div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {options.map(opt => {
          const isCorrect = opt === current.correct;
          const picked = opt === answer;
          let bg = 'white';
          if (showResult) {
            if (isCorrect) bg = '#86efac';
            else if (picked) bg = '#fca5a5';
          } else if (picked) bg = YELLOW;
          return (
            <button
              key={opt}
              onClick={() => handlePick(opt)}
              disabled={showResult}
              className="p-6 border-2 border-black font-extrabold text-lg rounded transition-all hover:translate-y-[-1px]"
              style={{ backgroundColor: bg }}
            >
              {opt}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-4 p-4 border border-gray-200 bg-white rounded">
          {answer === current.correct ? (
            <p className="font-bold text-green-700">✓ Correct! "{current.correct}" is right.</p>
          ) : (
            <p className="font-bold text-red-700">✗ The correct answer is "{current.correct}".</p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {!done && showResult && (
          <button onClick={next} className="px-6 py-3 font-extrabold uppercase tracking-wider rounded" style={{ backgroundColor: YELLOW }}>
            Next →
          </button>
        )}
        {done && (
          <div className="w-full p-6 text-center border-2 border-black rounded" style={{ backgroundColor: YELLOW }}>
            <Trophy size={32} className="mx-auto" />
            <p className="font-extrabold text-xl mt-2 uppercase">Done! Score: {score}/{data.length}</p>
            <button onClick={onComplete} className="mt-4 px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider rounded">
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Scenario Game =====
function ScenarioGame({ data, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const current = data[idx];

  const next = () => {
    if (idx < data.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
    }
  };

  const done = idx === data.length - 1 && picked !== null;

  return (
    <div className="max-w-2xl">
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-2">Scenario {idx + 1} of {data.length}</div>

      <div className="p-5 border-2 border-black bg-white rounded">
        <div className="flex gap-3 items-start">
          <AlertTriangle size={22} style={{ color: YELLOW }} className="flex-shrink-0 mt-0.5" />
          <p className="font-bold">{current.situation}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {current.options.map((opt, i) => {
          const isPicked = picked === i;
          let bg = 'white';
          if (picked !== null) {
            if (opt.correct) bg = '#86efac';
            else if (isPicked) bg = '#fca5a5';
          }
          return (
            <button
              key={i}
              disabled={picked !== null}
              onClick={() => setPicked(i)}
              className="w-full text-left p-4 border-2 border-black rounded transition-colors"
              style={{ backgroundColor: bg }}
            >
              <div className="font-bold">{opt.text}</div>
              {picked !== null && (isPicked || opt.correct) && (
                <div className="text-sm mt-2 text-gray-800">{opt.feedback}</div>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        {!done && picked !== null && (
          <button onClick={next} className="px-6 py-3 font-extrabold uppercase tracking-wider rounded" style={{ backgroundColor: YELLOW }}>
            Next Scenario →
          </button>
        )}
        {done && (
          <div className="w-full p-6 text-center border-2 border-black rounded" style={{ backgroundColor: YELLOW }}>
            <Trophy size={32} className="mx-auto" />
            <p className="font-extrabold text-xl mt-2 uppercase">Scenarios complete!</p>
            <button onClick={onComplete} className="mt-4 px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider rounded">
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Country-Commodity Game =====
function CountryCommodityGame({ data, onComplete }) {
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const current = data.questions[idx];
  const countries = Object.keys(data.countries);

  const handlePick = (country) => {
    if (showResult) return;
    setPicked(country);
    setShowResult(true);
    if (country === current.answer) setScore(score + 1);
  };

  const next = () => {
    if (idx < data.questions.length - 1) {
      setIdx(idx + 1);
      setPicked(null);
      setShowResult(false);
    }
  };

  const done = idx === data.questions.length - 1 && showResult;

  return (
    <div className="max-w-2xl">
      <p className="text-gray-700 mb-2">Which East & Central Africa country has this commodity?</p>
      <div className="text-xs uppercase tracking-widest text-gray-500 mb-4">Question {idx + 1} of {data.questions.length} · Score: {score}</div>

      <div className="p-6 border-2 border-black rounded mb-4 text-center" style={{ backgroundColor: YELLOW }}>
        <div className="text-xs uppercase tracking-widest font-bold">Commodity</div>
        <div className="text-2xl font-extrabold uppercase tracking-tight mt-1">{current.commodity}</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {countries.map((country) => {
          const isCorrect = country === current.answer;
          const isPicked = country === picked;
          let bg = 'white';
          if (showResult) {
            if (isCorrect) bg = '#86efac';
            else if (isPicked) bg = '#fca5a5';
          }
          return (
            <button
              key={country}
              onClick={() => handlePick(country)}
              disabled={showResult}
              className="p-4 border-2 border-black font-extrabold rounded transition-all hover:translate-y-[-1px] flex items-center gap-2 justify-center"
              style={{ backgroundColor: bg }}
            >
              <MapPin size={16} />
              {country}
            </button>
          );
        })}
      </div>

      {showResult && (
        <div className="mt-4 p-4 border border-gray-200 bg-white rounded">
          {picked === current.answer ? (
            <p className="font-bold text-green-700">✓ Correct! {current.commodity} is a key commodity in {current.answer}.</p>
          ) : (
            <p className="font-bold text-red-700">✗ Not quite. {current.commodity} is a key commodity in {current.answer}.</p>
          )}
        </div>
      )}

      <div className="mt-6 flex justify-end">
        {!done && showResult && (
          <button onClick={next} className="px-6 py-3 font-extrabold uppercase tracking-wider rounded" style={{ backgroundColor: YELLOW }}>
            Next →
          </button>
        )}
        {done && (
          <div className="w-full p-6 text-center border-2 border-black rounded" style={{ backgroundColor: YELLOW }}>
            <Trophy size={32} className="mx-auto" />
            <p className="font-extrabold text-xl mt-2 uppercase">Done! Score: {score}/{data.questions.length}</p>
            <button onClick={onComplete} className="mt-4 px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider rounded">
              Continue →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ===== Quiz View =====
function QuizView({ course, onComplete, onBack }) {
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [showResult, setShowResult] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = course.quiz[idx];

  const handlePick = (i) => {
    if (showResult) return;
    setAnswers({ ...answers, [idx]: i });
    setShowResult(true);
  };

  const next = () => {
    if (idx < course.quiz.length - 1) {
      setIdx(idx + 1);
      setShowResult(false);
    } else {
      setFinished(true);
    }
  };

  const score = Object.entries(answers).filter(([qi, ai]) => course.quiz[qi].answer === ai).length;

  if (finished) {
    const pct = Math.round((score / course.quiz.length) * 100);
    return (
      <div className="max-w-2xl">
        <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
          <ChevronLeft size={16} /> Back to {course.title}
        </button>
        <div className="p-8 border-2 border-black rounded text-center" style={{ backgroundColor: pct >= 60 ? YELLOW : GREY }}>
          <Trophy size={48} className="mx-auto" />
          <h2 className="text-3xl font-extrabold uppercase mt-4 tracking-tight">Quiz Complete!</h2>
          <p className="text-5xl font-extrabold mt-4">{score} / {course.quiz.length}</p>
          <p className="text-lg font-bold mt-2">{pct}% — {pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Well done!' : 'Keep learning!'}</p>
          <button onClick={() => onComplete(score)} className="mt-6 px-6 py-3 bg-black text-white font-extrabold uppercase tracking-wider rounded">
            Finish →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> Back to {course.title}
      </button>
      <p className="text-sm uppercase tracking-widest text-gray-500">Quiz · Question {idx + 1} of {course.quiz.length}</p>
      <h1 className="text-2xl font-extrabold tracking-tight mt-2">{current.q}</h1>
      <Swoosh w={120} />

      <div className="mt-6 space-y-2">
        {current.options.map((opt, i) => {
          const picked = answers[idx] === i;
          const isCorrect = current.answer === i;
          let bg = 'white';
          if (showResult) {
            if (isCorrect) bg = '#86efac';
            else if (picked) bg = '#fca5a5';
          } else if (picked) bg = YELLOW;
          return (
            <button
              key={i}
              onClick={() => handlePick(i)}
              disabled={showResult}
              className="w-full text-left p-4 border-2 border-black font-bold rounded transition-all hover:translate-y-[-1px]"
              style={{ backgroundColor: bg }}
            >
              {opt}
              {showResult && isCorrect && <span className="ml-2">✓</span>}
              {showResult && picked && !isCorrect && <span className="ml-2">✗</span>}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end">
        {showResult && (
          <button onClick={next} className="px-6 py-3 font-extrabold uppercase tracking-wider rounded" style={{ backgroundColor: YELLOW }}>
            {idx === course.quiz.length - 1 ? 'See Results' : 'Next Question'} →
          </button>
        )}
      </div>
    </div>
  );
}

// ===== Certificate View =====
function CertificateView({ userName, onBack, course = null, uid = '' }) {
  const [cert, setCert] = useState(null);

  useEffect(() => {
    if (!course || !uid) { setCert(null); return; }
    let cancelled = false;
    (async () => {
      const c = await loadCertificate(uid, course.id);
      if (!cancelled) setCert(c);
    })();
    return () => { cancelled = true; };
  }, [course?.id, uid]);

  const courseCode = course ? course.id.toUpperCase().slice(0, 3) : 'MST';
  const fallbackYear = new Date().getFullYear();
  const certId = cert?.certId || `SCA-${courseCode}-${fallbackYear}`;

  const issueDate = (cert?.issuedAt?.toDate?.() || new Date()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const courseTitle = course ? course.title : 'Jifunze Learning Hub — Master Certificate';

  return (
    <div>
      <button onClick={onBack} className="text-sm font-bold uppercase tracking-wider mb-4 inline-flex items-center gap-1 hover:underline">
        <ChevronLeft size={16} /> Back to Certificates
      </button>

      <div className="relative bg-white border border-gray-300 rounded-lg overflow-hidden shadow-xl max-w-4xl mx-auto" style={{ aspectRatio: '1.414 / 1' }}>
        <div className="absolute top-0 left-0 right-0 flex items-start justify-between p-5 md:p-7">
          <JifunzeIcon size={30} color={BLACK} accent={YELLOW} />
          <div className="flex flex-col items-end gap-2">
            <div className="flex flex-col items-end">
              <span className="font-extrabold text-sm md:text-base tracking-tight leading-none text-black">
                Solidaridad
              </span>
              <svg width="60" height="5" viewBox="0 0 60 5" className="mt-0.5">
                <path d="M2 3.5 Q 30 0.5, 58 2.5" stroke={YELLOW} strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
            </div>
            <div className="text-right">
              <div className="text-[9px] md:text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold">Certificate ID</div>
              <div className="text-xs md:text-sm font-extrabold tracking-wider mt-0.5">{certId}</div>
            </div>
          </div>
        </div>

        <div className="relative h-full flex flex-col items-center justify-center px-6 md:px-12 py-12 md:py-16 text-center">
          <p className="text-xs md:text-sm uppercase tracking-[0.3em] font-bold" style={{ color: YELLOW }}>
            Solidaridad Learning Academy
          </p>

          <h1 className="mt-4 md:mt-6 text-3xl md:text-5xl lg:text-6xl font-extrabold uppercase tracking-tight leading-none">
            Certificate of<br />Completion
          </h1>

          <p className="mt-6 md:mt-10 text-xs md:text-sm text-gray-600">This is to proudly certify that</p>
          <p className="mt-2 text-2xl md:text-4xl font-extrabold tracking-tight">{userName || 'Your Name'}</p>
          <div className="mt-2 mx-auto" style={{ width: '60%', maxWidth: 280, height: 2, backgroundColor: YELLOW }} />

          <p className="mt-5 md:mt-7 text-xs md:text-sm text-gray-700 max-w-xl">
            has successfully completed the required coursework, demonstrating mastery and commitment to our values in:
          </p>

          <p className="mt-3 md:mt-4 text-base md:text-xl font-extrabold tracking-tight">{courseTitle}</p>

          <div className="flex-1" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 grid grid-cols-3 items-end px-6 md:px-12 pb-6 md:pb-8">
          <div className="text-left">
            <div
              className="mb-2"
              style={{
                fontFamily: '"Brush Script MT", "Lucida Handwriting", "Segoe Script", cursive',
                fontStyle: 'italic',
                fontSize: '28px',
                color: '#1a2a6c',
                lineHeight: 1,
              }}
            >
              Rachel Wanyoike
            </div>
            <div className="text-xs md:text-sm font-extrabold border-t border-gray-400 pt-1 inline-block">R. Wanyoike</div>
            <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5">Managing Director, ECA</div>
          </div>

          <div className="flex justify-center">
            <div className="relative w-14 h-14 md:w-20 md:h-20 bg-black rounded-md flex items-center justify-center">
              <Award size={28} className="md:hidden" style={{ color: YELLOW }} />
              <Award size={42} className="hidden md:block" style={{ color: YELLOW }} />
              <div className="absolute -top-1 -left-1 w-2 h-2" style={{ backgroundColor: YELLOW }} />
              <div className="absolute -top-1 -right-1 w-2 h-2" style={{ backgroundColor: YELLOW }} />
              <div className="absolute -bottom-1 -left-1 w-2 h-2" style={{ backgroundColor: YELLOW }} />
              <div className="absolute -bottom-1 -right-1 w-2 h-2" style={{ backgroundColor: YELLOW }} />
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs md:text-sm font-extrabold">{issueDate}</div>
            <div className="text-[9px] md:text-[10px] uppercase tracking-widest text-gray-500 font-bold mt-0.5 border-t border-gray-400 pt-1 inline-block">Date of Issue</div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-500 mt-4">
        Take a screenshot to save your certificate · © Solidaridad {new Date().getFullYear()}
      </p>
    </div>
  );
}
