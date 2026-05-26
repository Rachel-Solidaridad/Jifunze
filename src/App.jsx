import React, { useState, useEffect } from 'react';
import { BookOpen, Award, CheckCircle2, ChevronRight, ChevronLeft, Home, Users, Target, Lightbulb, Shield, ShieldAlert, Globe, Mail, Palette, FileText, AlertTriangle, Sparkles, Trophy, X, Check, ArrowRight, RotateCcw, MapPin, TrendingUp, Leaf, Search, BarChart3, MessageSquare, BookMarked, Clock, Layers, Menu, DollarSign, CloudRain, Database, ClipboardCheck, Languages, Coffee, Apple, Wheat, Pickaxe, Shirt, Milk, Scissors, TreePalm, Bean, Lock } from 'lucide-react';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, serverTimestamp, query, orderBy, limit, onSnapshot, addDoc, writeBatch, increment } from 'firebase/firestore';
import { auth, googleProvider, ALLOWED_DOMAIN, db } from './firebase';

const YELLOW = '#FFC800';
const GREY = '#D9D9C3';
const BLACK = '#000000';

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

const COURSES = [
  {
    id: 'welcome',
    title: 'HR Culture & Compliance',
    subtitle: 'Onboarding essentials',
    category: 'Onboarding',
    icon: Users,
    duration: '1 hr',
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
    icon: Target,
    duration: '1 hr 15 min',
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
    icon: Shield,
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
    icon: AlertTriangle,
    duration: '30 min',
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
    icon: CloudRain,
    duration: '30 min',
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
    icon: DollarSign,
    duration: '20 min',
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
    icon: TrendingUp,
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
    icon: Palette,
    duration: '20 min',
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
    icon: Database,
    duration: '20 min',
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
    icon: ClipboardCheck,
    duration: '25 min',
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
  icon: Users,
  duration: '1 hr 15 min',
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
  category: 'Climate & NRM',
  icon: Leaf,
  duration: '1 hr',
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
  icon: Lightbulb,
  duration: '1 hr 15 min',
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


COURSES.push({
  id: 'risk',
  title: 'Risk Management',
  subtitle: 'Anticipate, decide, act',
  category: 'Compliance',
  icon: ShieldAlert,
  duration: '25 min',
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


// ===== Commodity course placeholders =====
// Lightweight stub entries — listed in the catalog under the Commodities cluster
// so staff can see what's coming. They are not openable, not counted toward
// completion stats, and have no lessons/quiz/interactive blocks.
const COMMODITY_PLACEHOLDERS = [
  { id: 'coffee', title: 'Coffee', subtitle: 'Coming soon', icon: Coffee, description: 'Solidaridad ECA\'s coffee curriculum — agronomy, certification, market access, and EUDR readiness. In development.' },
  { id: 'tea', title: 'Tea', subtitle: 'Coming soon', icon: Leaf, description: 'Solidaridad ECA\'s tea curriculum — sustainable cultivation, factory engagement, and farmer livelihoods. In development.' },
  { id: 'fruits-veg', title: 'Fruits & Vegetables', subtitle: 'Coming soon', icon: Apple, description: 'Solidaridad ECA\'s horticulture curriculum — production, post-harvest handling, food safety, and market linkages. In development.' },
  { id: 'food-crops', title: 'Food Crops', subtitle: 'Coming soon', icon: Wheat, description: 'Solidaridad ECA\'s food crops curriculum — maize, beans, sorghum, and other staples. In development.' },
  { id: 'gold', title: 'Gold', subtitle: 'Coming soon', icon: Pickaxe, description: 'Solidaridad ECA\'s artisanal and small-scale mining curriculum — responsible gold, mercury reduction, and miner welfare. In development.' },
  { id: 'leather', title: 'Leather', subtitle: 'Coming soon', icon: Shirt, description: 'Solidaridad ECA\'s leather curriculum — responsible sourcing, tanneries, and value-chain upgrading. In development.' },
  { id: 'dairy', title: 'Dairy', subtitle: 'Coming soon', icon: Milk, description: 'Solidaridad ECA\'s dairy curriculum — herd management, quality-based payment, and cooperative strengthening. In development.' },
  { id: 'cotton-textile', title: 'Cotton & Textile', subtitle: 'Coming soon', icon: Scissors, description: 'Solidaridad ECA\'s cotton and textile curriculum — Better Cotton, ginning, and the fashion value chain. In development.' },
  { id: 'oil-palm', title: 'Oil Palm', subtitle: 'Coming soon', icon: TreePalm, description: 'Solidaridad ECA\'s oil palm curriculum — smallholder production, RSPO standards, and deforestation-free supply chains. In development.' },
  { id: 'cocoa', title: 'Cocoa', subtitle: 'Coming soon', icon: Bean, description: 'Solidaridad ECA\'s cocoa curriculum — agroforestry, living income, and EUDR-aligned traceability. In development.' },
];

COMMODITY_PLACEHOLDERS.forEach(p => {
  COURSES.push({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    category: 'Commodities',
    icon: p.icon,
    duration: 'Coming soon',
    description: p.description,
    lessons: [],
    placeholder: true,
  });
});


// ===== Course clusters (catalog grouping) =====
const CLUSTERS = [
  {
    name: 'Strategy & Organisational Excellence',
    blurb: 'Strategy, people, communications, and how we measure what we change.',
    courseIds: ['masp', 'welcome', 'brand', 'pmel'],
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
    blurb: 'Crop, livestock, and value-chain curricula. Soy is live; more launching through MASP IV.',
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

async function saveCourseProgress(uid, courseId, partial) {
  if (!uid) return;
  try {
    await setDoc(
      doc(db, 'users', uid, 'progress', courseId),
      { ...partial, lastViewedAt: serverTimestamp() },
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

const CATEGORIES = ['All', 'Onboarding', 'Strategy', 'Climate & NRM', 'Commodities', 'Access to Finance', 'True Pricing', 'Gender', 'Communications', 'Digital', 'PMEL', 'Compliance', 'Ethics'];

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
  const [showNamePrompt, setShowNamePrompt] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user && isAllowedEmail(user.email)) {
        const email = user.email.toLowerCase();
        const uid = user.uid;
        setUserEmail(email);
        setUserUid(uid);
        const [p, storedName] = await Promise.all([
          loadProgress(uid),
          loadUserName(uid),
        ]);
        setProgress(p);
        const derived = user.displayName || nameFromEmail(email);
        if (storedName) {
          setUserName(storedName);
        } else if (derived) {
          setUserName(derived);
          saveUserName(uid, derived);
        } else {
          setShowNamePrompt(true);
        }
      } else {
        setUserEmail('');
        setUserUid('');
        setUserName('');
        setProgress({});
      }
      setLoaded(true);
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
    const next = {
      ...progress,
      [courseId]: { ...(progress[courseId] || {}), [key]: value },
    };
    setProgress(next);
    saveCourseProgress(userUid, courseId, { [key]: value });

    const course = COURSES.find(c => c.id === courseId);
    if (course
        && computeCompletion(course, progress[courseId]) < 100
        && computeCompletion(course, next[courseId]) === 100) {
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <SidebarLogo />
          <p className="mt-4 text-sm text-gray-500">Loading your learning hub…</p>
        </div>
      </div>
    );
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
            <button className="hidden sm:flex items-center gap-1.5 text-sm font-semibold hover:bg-gray-100 px-3 py-2 rounded">
              <Languages size={16} />
              <span style={{ backgroundColor: '#dbeafe', padding: '2px 6px', borderRadius: 4 }}>English (EN)</span>
            </button>
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
function DashboardPage({ userName, courses, courseCompletion, completedCount, inProgressCount, onSelectCourse, onGoToCatalog }) {
  const inProgressCourses = courses.filter(c => {
    const p = courseCompletion(c.id);
    return p > 0 && p < 100;
  });

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
            Explore the new Solidaridad ECA onboarding tracks below to learn how our digital tools, communications, PMEL, and field teams drive change that matters.
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
                  <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 border border-black rounded-full">{t.category || 'General'}</span>
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
  const POST_CATEGORIES = CATEGORIES.filter(c => c !== 'All');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState(POST_CATEGORIES[0]);
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
      await addDoc(collection(db, 'forum'), {
        title: title.trim(),
        body: body.trim(),
        category,
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
          <select
            value={category}
            onChange={e => setCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-black bg-white"
          >
            {POST_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
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
          <span className="text-xs uppercase tracking-widest font-bold px-2 py-0.5 border border-black rounded-full">{thread.category || 'General'}</span>
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
