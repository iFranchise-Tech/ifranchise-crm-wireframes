"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from "react";
import { CalendarDate } from "@internationalized/date";
import {
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiAddLine,
  RiArchiveLine,
  RiCalendarLine,
  RiCheckLine,
  RiCloseLine,
  RiDownloadLine,
  RiDeleteBinLine,
  RiExternalLinkLine,
  RiEyeLine,
  RiFacebookFill,
  RiFileTextLine,
  RiBarChartLine,
  RiFolderLine,
  RiGroupLine,
  RiGlobalLine,
  RiInstagramLine,
  RiLinkedinBoxFill,
  RiHomeLine,
  RiLogoutBoxRLine,
  RiMailLine,
  RiMailUnreadLine,
  RiMapPin2Line,
  RiNotification3Line,
  RiPhoneLine,
  RiQuestionLine,
  RiStore2Line,
  RiSearchLine,
  RiStarFill,
  RiStarLine,
  RiStackLine,
  RiSparklingLine,
  RiTimeLine,
  RiTrophyLine,
} from "@remixicon/react";
import { ReviewShell } from "@/modules/screen-library/components/review-shell";
import { Avatar } from "@/components/base/avatar/avatar";
import { Checkbox } from "@/components/base/checkbox/checkbox";
import { Chip, type ChipColor } from "@/components/base/badges/chip";
import { DateCalendar } from "@/components/base/date-picker/date-calendar";
import { Dropdown, DropdownDivider, DropdownItem, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Modal, ModalBody, ModalFooter, ModalHeader } from "@/components/base/modal/modal";
import { ScrollFade, useScrollFade } from "@/components/foundations/scroll-fade/scroll-fade";
import { portraitFor } from "@/modules/users-roles/portrait";
import { Select as BoardSelect, SelectItem } from "@/components/base/select/select";
import { cx } from "@/utils/cx";
import {
  documents,
  emoriInvoiceSummary,
  initialAudits,
  initialMeetings,
  initialNotices,
  initialUsers,
  invoices,
  inr,
  monthDay,
  opportunities,
  shortDate,
} from "../data";
import {
  franchiseModels,
  portalBrands,
  reviewDate,
  stages,
  type BrandDocument,
  type BrandId,
  type Invoice,
  type Meeting,
  type Notice,
  type Opportunity,
  type PaymentStatus,
  type PortalRole,
  type Stage,
} from "../types";
import "./brand-portal.css";

const views = [
  { id: "Overview", label: "Overview" },
  { id: "Opportunities", label: "Opportunities" },
  { id: "Meetings", label: "Meetings" },
  { id: "Deals", label: "Deals" },
  { id: "Invoices", label: "Invoices & Documents" },
  { id: "Reports", label: "Reports" },
  { id: "Notifications", label: "Notifications" },
  { id: "Users", label: "Users" },
] as const;
type ViewId = (typeof views)[number]["id"];
type BrandGalleryTile = { title: string; detail: string; position: string };
const brandGallery: Record<BrandId, BrandGalleryTile[]> = {
  emori: [
    { title: "A closer look at brilliance", detail: "Lab-grown diamonds · Emori", position: "0% 0%" },
    { title: "Boutique-inspired atmosphere", detail: "A considered retail concept", position: "33.333% 0%" },
    { title: "Made with care", detail: "Crafted details · Fine jewellery", position: "66.667% 0%" },
    { title: "The details that shine", detail: "A study in light and form", position: "100% 100%" },
  ],
  brew: [
    { title: "A better coffee break", detail: "Brew Theory · Café culture", position: "100% 0%" },
    { title: "Made for slow mornings", detail: "Thoughtful coffee · Warm spaces", position: "66.667% 66.667%" },
    { title: "A little more refreshment", detail: "Made to share · Made to stay", position: "100% 66.667%" },
  ],
  odette: [
    { title: "A Parisian point of view", detail: "Odette Paris · Contemporary fashion", position: "0% 33.333%" },
    { title: "Quietly considered", detail: "Form · Fabric · Finish", position: "33.333% 33.333%" },
    { title: "Tradition in a new light", detail: "A wardrobe with character", position: "66.667% 33.333%" },
  ],
  franco: [
    { title: "Style, your own way", detail: "Franco · Fashion & lifestyle", position: "33.333% 33.333%" },
    { title: "Everyday expression", detail: "Texture · Shape · Detail", position: "0% 33.333%" },
    { title: "Made to be discovered", detail: "A fresh retail perspective", position: "33.333% 100%" },
  ],
  rasturi: [
    { title: "Crafted in color", detail: "Rasturi Creations · Indian ethnic wear", position: "66.667% 33.333%" },
    { title: "Details with a story", detail: "Woven texture · Golden accents", position: "33.333% 33.333%" },
    { title: "Tradition, worn forward", detail: "Modern occasionwear", position: "0% 33.333%" },
  ],
  original: [
    { title: "The original, made fresh", detail: "Original Burger Co. · Made to order", position: "100% 33.333%" },
    { title: "Big flavor, no fuss", detail: "From the grill · Served hot", position: "0% 66.667%" },
    { title: "Good things go together", detail: "A table made for sharing", position: "0% 100%" },
  ],
  biggies: [
    { title: "Go big on flavor", detail: "Biggies Burger · Grill-forward", position: "0% 66.667%" },
    { title: "A signature stack", detail: "Big, bold, freshly grilled", position: "100% 33.333%" },
    { title: "A table full of favorites", detail: "Made for sharing", position: "0% 100%" },
  ],
  g: [
    { title: "Big flavor, made fresh", detail: "Bigguys · Burgers from the grill", position: "0% 66.667%" },
    { title: "A signature stack", detail: "Bold bites · Golden fries", position: "100% 33.333%" },
    { title: "Made for sharing", detail: "A table full of favorites", position: "0% 100%" },
  ],
  downing: [
    { title: "A classic with a twist", detail: "10 Downing Street · Dining & hospitality", position: "66.667% 66.667%" },
    { title: "Settle in a little longer", detail: "Warm light · Thoughtful interiors", position: "100% 0%" },
    { title: "Good food, good company", detail: "A place to come together", position: "100% 33.333%" },
  ],
  freshco: [
    { title: "Bring back the fizz", detail: "FreshCo · Goli Soda", position: "100% 66.667%" },
    { title: "A brighter kind of refreshment", detail: "Colorful · Crisp · Nostalgic", position: "100% 100%" },
    { title: "A little taste of summer", detail: "Made to be shared", position: "100% 0%" },
  ],
  fusion: [
    { title: "More flavor, more to share", detail: "Fusion Pizza Big Burger Co.", position: "0% 100%" },
    { title: "Everyone has a favorite", detail: "Pizza · Burgers · Good company", position: "100% 33.333%" },
    { title: "Make room at the table", detail: "A playful take on comfort food", position: "0% 66.667%" },
  ],
  avenue: [
    { title: "Find your next avenue", detail: "Brand Avenue · Built for growth", position: "33.333% 100%" },
    { title: "A brand, brought to life", detail: "Strategy meets experience", position: "33.333% 66.667%" },
    { title: "Make a lasting first impression", detail: "A distinct presence on every street", position: "0% 33.333%" },
  ],
  lassi: [
    { title: "A cooler kind of classic", detail: "Lassi No Cafe International", position: "66.667% 100%" },
    { title: "A refreshing favorite", detail: "Indian flavors · Café moments", position: "100% 66.667%" },
    { title: "A little more to savor", detail: "Made for a brighter day", position: "100% 0%" },
  ],
};
const pageSize = 15;
const socialPlatforms = [
  { name: "Instagram", Icon: RiInstagramLine },
  { name: "LinkedIn", Icon: RiLinkedinBoxFill },
  { name: "Facebook", Icon: RiFacebookFill },
  { name: "Website", Icon: RiGlobalLine },
] as const;

const stageColor: Record<Stage, ChipColor> = {
  New: "gray",
  Qualified: "lime",
  Meeting: "blue",
  Hot: "rose",
  "Token Collected": "yellow",
  Won: "lime",
  Lost: "rose",
};
const paymentColor: Record<PaymentStatus, ChipColor> = {
  "In Progress": "blue",
  "Partially Paid": "yellow",
  "Not Started": "gray",
  Paid: "lime",
  Pending: "yellow",
};

function asView(view?: string): ViewId {
  return views.some(item => item.id === view) ? view as ViewId : "Overview";
}

function initials(name: string) {
  const parts = name.split(" ").filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

function maskOpportunityEmail(email?: string) {
  const [local = "", domain = ""] = email?.split("@") ?? [];
  if (!local || !domain) return "********";
  const visiblePrefix = local.slice(0, 2);
  return `${visiblePrefix}${"*".repeat(Math.max(3, local.length - visiblePrefix.length))}@${domain}`;
}

function maskOpportunityPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  const countryCode = phone.match(/^\+\d+/)?.[0] ?? "";
  const lastFour = digits.slice(-4);
  return `${countryCode ? `${countryCode} ` : ""}*** *** ${lastFour}`.trim();
}

function opportunityMatchesTimeRange(value: string, range: string) {
  if (range === "All Time") return true;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return false;
  const now = Date.now();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (range === "Today") return timestamp >= today.getTime();
  if (range === "Last 7 days") return timestamp >= now - 7 * 86_400_000;
  if (range === "Last 30 days") return timestamp >= now - 30 * 86_400_000;
  return true;
}

function inRange(iso: string, range: string) {
  if (range === "Last 7 Days") return iso >= "2026-11-09" && iso <= reviewDate;
  if (range === "Last 30 Days") return iso >= "2026-10-17" && iso <= reviewDate;
  return iso >= "2026-10-01" && iso <= "2026-12-31";
}

function stamp() {
  return "16 Nov 2026, 10:30 AM";
}

export function BrandWorkspace({ view, stage, focus }: { view?: string; stage?: string; focus?: string }) {
  const router = useRouter();
  const section = asView(view);
  const [userId, setUserId] = useState(initialUsers[0].id);
  const [brandId, setBrandId] = useState<BrandId>(initialUsers[0].brandId);
  const [brandOpen, setBrandOpen] = useState(false);
  const [pipelineHover, setPipelineHover] = useState<Stage | null>(null);
  const [people, setPeople] = useState(initialUsers);
  const [meetings, setMeetings] = useState(initialMeetings);
  const [notices, setNotices] = useState(initialNotices);
  const [audits, setAudits] = useState(initialAudits);
  const [range, setRange] = useState("Last 30 Days");
  const [query, setQuery] = useState("");
  const [oppStage, setOppStage] = useState(stage && stages.includes(stage as Stage) ? stage : "All stages");
  const [model, setModel] = useState("All models");
  const [oppLocation, setOppLocation] = useState("All locations");
  const [oppDateRange, setOppDateRange] = useState("All dates");
  const [dealStage, setDealStage] = useState(stage && stages.includes(stage as Stage) ? stage : "All");
  const [dealPayment, setDealPayment] = useState("All payments");
  const [dealLocation, setDealLocation] = useState("All locations");
  const [dealClosure, setDealClosure] = useState("All dates");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showOpportunityOverview, setShowOpportunityOverview] = useState(false);
  const [docTab, setDocTab] = useState<"Invoices" | "Documents">("Invoices");

  const user = people.find(item => item.id === userId) ?? initialUsers[0];
  const brand = portalBrands.find(item => item.id === brandId)!;
  const admin = user.role === "Brand Admin";

  useEffect(() => {
    const picked = stage && stages.includes(stage as Stage) ? stage : "";
    if (section === "Opportunities") setOppStage(picked || "All stages");
    if (section === "Deals") setDealStage(picked || "All");
  }, [section, stage]);

  useEffect(() => {
    setPage(1);
    setOpenId(focus && (section === "Opportunities" || section === "Deals") ? focus : null);
  }, [brand.id, query, oppStage, model, oppLocation, oppDateRange, dealStage, dealPayment, dealLocation, dealClosure, section, focus]);

  useEffect(() => {
    if (focus?.startsWith("DOC-")) setDocTab("Documents");
    if (focus?.startsWith("INV-")) setDocTab("Invoices");
  }, [focus]);

  function go(next: ViewId, extra?: { stage?: string; focus?: string }) {
    const params = new URLSearchParams({ view: next });
    if (extra?.stage) params.set("stage", extra.stage);
    if (extra?.focus) params.set("focus", extra.focus);
    router.push(`/library/modules/brands?${params}`);
  }

  function record(action: string, related: string) {
    setAudits(list => [{ id: `AUD-${Date.now()}`, brandId: brand.id, user: user.name, action, related, when: stamp() }, ...list]);
  }

  const brandOpps = useMemo(() => opportunities.filter(item => item.brandId === brand.id), [brand.id]);
  const ranged = brandOpps.filter(item => inRange(item.created, range));
  const brandMeetings = meetings.filter(item => item.brandId === brand.id);
  const upcoming = brandMeetings.filter(item => item.status === "Upcoming");
  const completed = brandMeetings.filter(item => item.status === "Completed" && inRange(item.date, range));
  const brandInvoices = invoices.filter(item => item.brandId === brand.id);
  const brandDocs = documents.filter(item => item.brandId === brand.id);
  const unread = notices.filter(item => item.brandId === brand.id && item.unread).length;
  const open = brandOpps.find(item => item.id === openId) ?? null;

  const searched = brandOpps.filter(item => {
    const haystack = `${item.id} ${item.customer} ${item.contact} ${item.city} ${item.model}`.toLowerCase();
    return (oppStage === "All stages" || item.stage === oppStage)
      && (model === "All models" || item.model === model)
      && (oppLocation === "All locations" || item.city === oppLocation)
      && (oppDateRange === "All dates" || inRange(item.created, oppDateRange))
      && haystack.includes(query.trim().toLowerCase());
  });
  const dealLocations = Array.from(new Set(brandOpps.filter(item => item.dealValue != null).map(item => item.city))).sort();
  const deals = brandOpps.filter(item => {
    const closure = item.closure ? new Date(`${item.closure}T00:00:00`) : null;
    const today = new Date(`${reviewDate}T00:00:00`);
    const day = 24 * 60 * 60 * 1000;
    const inClosure = dealClosure === "All dates"
      || (!!closure && dealClosure === "This month" && closure.getFullYear() === today.getFullYear() && closure.getMonth() === today.getMonth())
      || (!!closure && dealClosure === "Next 30 days" && closure >= today && closure <= new Date(today.getTime() + 30 * day))
      || (!!closure && dealClosure === "Past 30 days" && closure < today && closure >= new Date(today.getTime() - 30 * day));
    const haystack = `${item.id} ${item.customer} ${item.contact} ${item.city} ${item.model}`.toLowerCase();
    return item.dealValue != null
      && (dealStage === "All" || item.stage === dealStage)
      && (dealPayment === "All payments" || item.payment === dealPayment)
      && (dealLocation === "All locations" || item.city === dealLocation)
      && inClosure
      && haystack.includes(query.trim().toLowerCase());
  });
  const tableRows = section === "Deals" ? deals : searched;
  const pages = Math.max(1, Math.ceil(tableRows.length / pageSize));
  const safePage = Math.min(page, pages);
  const visibleRows = tableRows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const meetingPool = brandMeetings.slice().sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

  const summary = brand.id === "emori"
    ? emoriInvoiceSummary
    : {
        total: brandInvoices.reduce((sum, item) => sum + item.amount, 0),
        paid: brandInvoices.filter(item => item.status === "Paid").reduce((sum, item) => sum + item.amount, 0),
        pending: brandInvoices.filter(item => item.status !== "Paid").reduce((sum, item) => sum + item.amount, 0),
      };

  function count(stageName: Stage, source = ranged) {
    return source.filter(item => item.stage === stageName).length;
  }

  function handlePipelinePointerMove(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (rect.left + rect.width / 2);
    const dy = event.clientY - (rect.top + rect.height / 2);
    const radius = Math.hypot(dx, dy);
    if (radius < rect.width * 0.34 || radius > rect.width * 0.5 || brandOpps.length === 0) {
      setPipelineHover(null);
      return;
    }

    const angle = (Math.atan2(dy, dx) * 180 / Math.PI + 450) % 360;
    const target = angle / 360 * brandOpps.length;
    let offset = 0;
    for (const stageName of stages) {
      const next = offset + brandOpps.filter(item => item.stage === stageName).length;
      if (target >= offset && target < next) {
        setPipelineHover(stageName);
        return;
      }
      offset = next;
    }
    setPipelineHover(null);
  }

  const heading = open ? open.id : views.find(item => item.id === section)?.label ?? "Overview";

  const nav = (
    <nav className="review-navigation bp-side" aria-label="Brand Portal">
      {views.map(item => (
        <Link key={item.id} className="review-overview-link" href={`/library/modules/brands?view=${item.id}`} aria-current={section === item.id ? "page" : undefined}>
          {item.id === "Overview" ? <RiHomeLine /> : item.id === "Opportunities" ? <RiStackLine /> : item.id === "Meetings" ? <RiCalendarLine /> : item.id === "Deals" ? <RiTrophyLine /> : item.id === "Invoices" ? <RiFileTextLine /> : item.id === "Reports" ? <RiBarChartLine /> : item.id === "Notifications" ? <RiNotification3Line /> : <RiGroupLine />}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );

  return (
    <ReviewShell className="bp-shell" moduleName="Brand Portal" icon="building" subtitle={brand.name} overviewHref="/library/modules/brands?view=Overview" title={heading} navigation={nav} sidebarAccount={
      <Dropdown isOpen={brandOpen} onOpenChange={setBrandOpen}>
        <DropdownTrigger className="bp-brand-switch-trigger" aria-label={`Choose brand account. Current brand: ${brand.name}`}>
          <span className="bp-brand-switch-logo">{brand.logo ? <img src={brand.logo} alt="" /> : <strong>{brand.name.slice(0, 2).toUpperCase()}</strong>}</span>
          <span className="bp-brand-switch-copy"><strong>Brand Portal</strong><small>{brand.name}</small></span>
          <RiArrowDownSLine />
        </DropdownTrigger>
        <DropdownPopover aria-label="Choose a brand to explore" placement="bottom end" className="bp-brand-switch-popover w-[292px]">
          <div className="bp-brand-switch-title"><strong>Explore brands</strong><small>Select a brand to view its portal</small></div>
          <DropdownDivider />
          {portalBrands.map(item => <DropdownItem key={item.id} selected={item.id === brand.id} onSelect={() => { setBrandId(item.id); const nextUser = people.find(person => person.brandId === item.id && person.status === "Active"); if (nextUser) setUserId(nextUser.id); setOpenId(null); setBrandOpen(false); }}><span className="bp-brand-option-logo">{item.logo ? <img src={item.logo} alt="" /> : <strong>{item.name.slice(0, 2).toUpperCase()}</strong>}</span><span className="bp-brand-option-copy"><strong>{item.name}</strong><small>{item.industry}</small></span></DropdownItem>)}
        </DropdownPopover>
      </Dropdown>
    } controls={
      <div className="bp-toolbar-actions">
        <button className="bp-top-icon bp-top-bell" type="button" aria-label={`${unread} unread notifications`} title="Notifications" onClick={() => go("Notifications")}><RiNotification3Line />{unread > 0 && <i>{unread}</i>}</button>
        <Dropdown>
          <DropdownTrigger className="bp-toolbar-profile" aria-label={`Profile menu for ${user.name}`}>
            <span className="bp-profile-avatar" data-brand-theme={brand.theme}>{initials(user.name)}</span>
          </DropdownTrigger>
          <DropdownPopover aria-label="Profile options" placement="bottom end" className="bp-profile-popover w-[260px]" dialogClassName="gap-1">
            <div className="bp-profile-menu-heading">
              <span className="bp-profile-avatar is-menu" data-brand-theme={brand.theme}>{initials(user.name)}</span>
              <span><strong>{user.name}</strong><small><RiMailLine />{user.email}</small></span>
            </div>
            <DropdownDivider />
            <DropdownItem onSelect={() => router.push("/library")}><RiQuestionLine />Help &amp; guides</DropdownItem>
            <DropdownDivider />
            <DropdownItem className="bp-profile-logout" onSelect={() => router.push("/sign-in")}><RiLogoutBoxRLine />Sign out</DropdownItem>
          </DropdownPopover>
        </Dropdown>
      </div>
    } sidebarFooter={<div className="bp-sidebar-brand">{brand.logo ? <img className={brand.id === "emori" ? "is-emori-logo" : ""} src={brand.logo} alt={`${brand.name} logo`} /> : <><span className="bp-sidebar-brand-spark">✦</span><strong>{brand.name.toUpperCase()}</strong><small>BRAND PORTAL</small></>}</div>}>
      <div className="bp-board">
      <div className="bp-scroll" data-view={section} data-detail={open ? "true" : undefined}>
          {open ? (
            <OpportunityDetail
              opportunity={open}
              returnLabel={section === "Deals" ? "Deals" : "Opportunities"}
              brandName={brand.name}
              coordinator={brand.coordinator}
              meetings={brandMeetings.filter(item => item.opportunityId === open.id)}
              invoices={brandInvoices.filter(item => item.opportunityId === open.id)}
              docs={brandDocs.filter(item => item.opportunityId === open.id)}
              onBack={() => setOpenId(null)}
              onDownload={invoice => { downloadInvoice(invoice); record("Downloaded an invoice", invoice.id); }}
            />
          ) : section === "Overview" ? (
            <>
              <div className="bp-landing">
                <section className="bp-hero bp-brand-banner" data-brand-theme={brand.theme} aria-label={`${brand.name} franchise overview`}>
                  <div className="bp-banner-copy">
                    <span className="bp-banner-kicker">{brand.name.toUpperCase()} · {brand.industry.toUpperCase()}</span>
                    <h2>{brand.headline}<br /><em>{brand.accent}</em></h2>
                    <p>{brand.description}</p>
                    <div className="bp-banner-points">{brand.highlights.map((highlight, index) => <span key={highlight}>{index > 0 && <i />}{highlight}</span>)}</div>
                    <div className="bp-banner-actions"><button onClick={() => go("Opportunities")}>Explore Opportunities<RiArrowRightSLine /></button></div>
                  </div>
                </section>
                <div className="bp-overview-grid">
                  <section className="bp-card bp-pipeline-card">
                    <div className="bp-card-head"><h3>Opportunity Pipeline</h3><button className="bp-link bp-pipeline-view-all" onClick={() => go("Opportunities")}>View all <RiArrowRightSLine /></button></div>
                    <div className="bp-pipeline-content">
                      <div className={`bp-pipeline-donut${brandOpps.length ? "" : " is-empty"}`} onPointerMove={handlePipelinePointerMove} onPointerLeave={() => setPipelineHover(null)} style={{ background: brandOpps.length ? `conic-gradient(${stages.map((stageName, index) => { const start = stages.slice(0, index).reduce((total, name) => total + brandOpps.filter(item => item.stage === name).length, 0); const end = start + brandOpps.filter(item => item.stage === stageName).length; const startDeg = start / brandOpps.length * 360; const endDeg = end / brandOpps.length * 360; const color = ["#7135db", "#9b63e9", "#e6a8c2", "#f0c875", "#f6bd61", "#a7c99c", "#e7e4e8"][index]; return `${pipelineHover && pipelineHover !== stageName ? `${color}55` : color} ${startDeg}deg ${endDeg}deg`; }).join(",")})` : "conic-gradient(#e9e6ef 0deg 360deg)" }}>
                        <span><strong>{pipelineHover ? brandOpps.filter(item => item.stage === pipelineHover).length : brandOpps.length}</strong><small>{pipelineHover ?? "Total"}</small></span>
                      </div>
                      <div className="bp-pipeline-legend">{stages.map((stageName, index) => <div className={pipelineHover === stageName ? "is-highlighted" : ""} onPointerEnter={() => setPipelineHover(stageName)} onPointerLeave={() => setPipelineHover(null)} key={stageName}><i style={{ background: ["#7135db", "#9b63e9", "#e6a8c2", "#f0c875", "#f6bd61", "#a7c99c", "#e7e4e8"][index] }} /><span>{stageName}</span><strong>{brandOpps.filter(item => item.stage === stageName).length}</strong></div>)}</div>
                    </div>
                  </section>
                  <section className="bp-card bp-upcoming-card bp-upcoming-feature-card">
                    <div className="bp-card-head"><h3><RiCalendarLine />Upcoming Meeting</h3><button className="bp-icon-link" aria-label="View meetings" onClick={() => go("Meetings")}><RiArrowRightSLine /></button></div>
                    {upcoming[0] ? <div className="bp-upcoming-feature">
                      <span className="bp-upcoming-date"><small>{monthDay(upcoming[0].date).month}</small><strong>{monthDay(upcoming[0].date).day}</strong></span>
                      <div className="bp-upcoming-feature-details">
                        <strong>{upcoming[0].title}</strong>
                        <div className="bp-upcoming-feature-meta"><span><RiTimeLine />{upcoming[0].time}</span>{upcoming[0].kind === "Virtual" ? <span className="bp-google-meet-mark"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Meet_icon_%282026%29.svg" alt="" />Google Meet</span> : <span><RiMapPin2Line />{upcoming[0].place}</span>}</div>
                        {upcoming[0].kind === "Virtual" && upcoming[0].meetLink ? <a className="bp-upcoming-join" href={upcoming[0].meetLink} target="_blank" rel="noreferrer">Join meeting <RiExternalLinkLine /></a> : <button className="bp-upcoming-join" onClick={() => go("Meetings", { focus: upcoming[0].id })}>View details <RiArrowRightSLine /></button>}
                      </div>
                    </div> : <p className="bp-empty">No upcoming meetings.</p>}
                  </section>
                </div>
              </div>
            </>
          ) : section === "Opportunities" ? (
            <>
              <div className="bp-list-page">
                <header className="bp-hello"><div><h2>Opportunities</h2><p>Franchise opportunities assigned to {brand.name} only.</p></div><button type="button" className="bp-quick-overview-trigger" aria-expanded={showOpportunityOverview} onClick={() => setShowOpportunityOverview(value => !value)}><RiBarChartLine />{showOpportunityOverview ? "Hide quick overview" : "Quick overview"}</button></header>
                {showOpportunityOverview && <div className="bp-list-stats" aria-label="Opportunity summary">
                  <Stat icon={<RiGroupLine />} tone="blue" value={String(brandOpps.length)} label="Total Opportunities" onClick={() => setOppStage("All stages")} />
                  <Stat icon={<RiStackLine />} tone="purple" value={String(count("New", brandOpps))} label="New" onClick={() => setOppStage("New")} />
                  <Stat icon={<RiSparklingLine />} tone="green" value={String(count("Qualified", brandOpps))} label="Qualified" onClick={() => setOppStage("Qualified")} />
                  <Stat icon={<RiCalendarLine />} tone="amber" value={String(count("Meeting", brandOpps))} label="Meetings" onClick={() => setOppStage("Meeting")} />
                  <Stat icon={<RiTrophyLine />} tone="green" value={String(count("Won", brandOpps))} label="Won" onClick={() => setOppStage("Won")} />
                </div>}
                <section className="bp-list-card" aria-label="Opportunity list">
                  <div className="bp-opportunity-toolbar">
                    <label className="bp-search"><RiSearchLine /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by customer or opportunity ID" aria-label="Search opportunities" /></label>
                    <BoardSelect aria-label="Stage" selectedKey={oppStage} onSelectionChange={key => setOppStage(String(key))} className="bp-opportunity-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All stages", ...stages].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Franchise model" selectedKey={model} onSelectionChange={key => setModel(String(key))} className="bp-opportunity-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All models", ...franchiseModels].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Location" selectedKey={oppLocation} onSelectionChange={key => setOppLocation(String(key))} className="bp-opportunity-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All locations", ...Array.from(new Set(brandOpps.map(item => item.city))).sort()].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Date range" selectedKey={oppDateRange} onSelectionChange={key => setOppDateRange(String(key))} className="bp-opportunity-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All dates", "Last 7 Days", "Last 30 Days", "This quarter"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                  </div>
                  <div className="bp-table-card bp-list-table-wrap">
                    <DataTable rows={visibleRows} mode="opportunity" onOpen={setOpenId} />
                    <Pager page={safePage} pages={pages} total={tableRows.length} onPage={setPage} />
                  </div>
                </section>
              </div>
            </>
          ) : section === "Meetings" ? (
            <MeetingCalendar
                meetings={meetingPool}
                brandId={brand.id}
                brandName={brand.name}
                opportunities={brandOpps}
                userName={user.name}
                focusId={focus?.startsWith("MTG-") ? focus : undefined}
                onSave={next => {
                  setMeetings(list => list.some(item => item.id === next.id) ? list.map(item => item.id === next.id ? next : item) : [...list, next]);
                  record("Scheduled a brand meeting", next.title);
                }}
                onUpdate={next => {
                  setMeetings(list => list.map(item => item.id === next.id ? next : item));
                  record("Updated a scheduled meeting", next.title);
                }}
              />
          ) : section === "Deals" ? (
            <>
              <div className="bp-list-page">
                <header className="bp-hello"><div><h2>Deals</h2><p>Franchise deals and their current status for {brand.name}.</p></div></header>
                <section className="bp-list-card bp-deals-list" aria-label="Deals list">
                  <div className="bp-deals-toolbar">
                    <label className="bp-search"><RiSearchLine /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by name or opportunity ID" aria-label="Search deals" /></label>
                    <BoardSelect aria-label="Filter deals by stage" selectedKey={dealStage} onSelectionChange={key => setDealStage(String(key))} className="bp-deal-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All", "Lost", "Won", "Hot", "Token Collected"].map(item => <SelectItem key={item} id={item}>{item === "All" ? "All stages" : item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Filter deals by payment status" selectedKey={dealPayment} onSelectionChange={key => setDealPayment(String(key))} className="bp-deal-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All payments", "In Progress", "Partially Paid", "Not Started", "Paid", "Pending"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Filter deals by location" selectedKey={dealLocation} onSelectionChange={key => setDealLocation(String(key))} className="bp-deal-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All locations", ...dealLocations].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                    <BoardSelect aria-label="Filter deals by closure date" selectedKey={dealClosure} onSelectionChange={key => setDealClosure(String(key))} className="bp-deal-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
                      {["All dates", "This month", "Next 30 days", "Past 30 days"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
                    </BoardSelect>
                  </div>
                  <div className="bp-table-card bp-list-table-wrap">
                    <DataTable rows={visibleRows} mode="deal" onOpen={setOpenId} />
                    <Pager page={safePage} pages={pages} total={tableRows.length} onPage={setPage} />
                  </div>
                </section>
              </div>
            </>
          ) : section === "Invoices" ? (
            <>
              <InvoicePanel tab={docTab} onTab={setDocTab} brandName={brand.name} invoices={brandInvoices} docs={brandDocs} focusId={focus} onOpen={setOpenId} onDownload={invoice => { downloadInvoice(invoice); record("Downloaded an invoice", invoice.id); }} />
            </>
          ) : section === "Reports" ? (
            <Reports range={range} onRange={setRange} opportunities={ranged} meetings={brandMeetings} invoices={brandInvoices} upcoming={upcoming.length} completed={completed.length} summary={summary} onOpen={go} />
          ) : section === "Notifications" ? (
            <>
              <header className="bp-hello"><div><h2>Notifications</h2><p>Updates for {brand.name}. Nothing here belongs to another brand.</p></div></header>
              <NotificationsPanel
                notices={notices.filter(item => item.brandId === brand.id)}
                meetings={brandMeetings}
                opportunities={brandOpps}
                onRead={id => setNotices(list => list.map(item => item.id === id ? { ...item, unread: false } : item))}
                onSetRead={(id, unread) => setNotices(list => list.map(item => item.id === id ? { ...item, unread } : item))}
                onReadMany={ids => setNotices(list => list.map(item => ids.includes(item.id) ? { ...item, unread: false } : item))}
                onDeleteMany={ids => setNotices(list => list.filter(item => !ids.includes(item.id)))}
                onOpenTarget={notice => {
                  const target = notice.targetId;
                  if (!target) { go("Overview"); return; }
                  if (notice.targetType === "opportunity") go(notice.title.toLowerCase().includes("deal") ? "Deals" : "Opportunities", { focus: target });
                  else if (notice.targetType === "invoice" || notice.targetType === "document") go("Invoices", { focus: target });
                  else if (notice.targetType === "meeting") go("Meetings", { focus: target });
                }}
              />
            </>
          ) : (
              <UsersView
              brandName={brand.name}
              people={people.filter(item => item.brandId === brand.id)}
              audits={audits.filter(item => item.brandId === brand.id)}
              admin={admin}
              currentId={user.id}
                onUpdate={person => {
                  setPeople(list => list.map(item => item.id === person.id ? { ...item, name: person.name, email: person.email, role: person.role } : item));
                  record("Updated brand user details", person.name);
                }}
              onDeactivate={person => {
                setPeople(list => list.map(item => item.id === person.id ? { ...item, status: "Inactive" } : item));
                record("Deactivated a brand user", person.name);
              }}
            />
          )}
        </div>
      </div>
    </ReviewShell>
  );
}

function Stat({ icon, tone, value, label, delta, onClick }: { icon: ReactNode; tone: string; value: string; label: string; delta?: string; onClick?: () => void }) {
  const body = <><span><strong>{value}</strong><em>{label}</em>{delta && <b>{delta}</b>}</span><span className={`bp-stat-icon is-${tone}`}>{icon}</span></>;
  return onClick ? <button className="bp-stat" onClick={onClick}>{body}</button> : <div className="bp-stat">{body}</div>;
}

function DataTable({ rows, mode, onOpen }: { rows: Opportunity[]; mode: "opportunity" | "deal"; onOpen: (id: string) => void }) {
  return (
      <table className={`bp-table is-open bp-opportunity-table is-${mode}`}>
        <thead>
          <tr>
            {mode === "opportunity"
              ? ["Opportunity", "Franchise Model", "Location", "Customer Contact", "Stage", "Last Activity", "Created On"].map(item => <th key={item}>{item}</th>)
              : ["Opportunity", "Franchise Model", "Location", "Approved Deal Value", "Payment Status", "Closure Date"].map(item => <th key={item}>{item}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} onClick={() => onOpen(row.id)}>
              <td><span className="bp-row-person"><i>{initials(row.customer)}</i><span><strong>{row.customer}</strong><small>{row.id}</small></span></span></td>
              <td>{row.model}</td>
              <td><span className="bp-row-location"><RiMapPin2Line />{row.city}</span></td>
              {mode === "opportunity" ? (
                <>
                  <td><span className="bp-row-contact"><strong>{row.contact}</strong><small>Phone · {maskOpportunityPhone(row.phone)}</small></span></td>
                  <td><Chip variant="caption" color={stageColor[row.stage]}>{row.stage}</Chip></td>
                  <td>{row.activity}</td>
                  <td>{shortDate(row.created)}</td>
                </>
              ) : (
                <>
                  <td>{row.dealValue != null ? inr(row.dealValue) : "—"}</td>
                  <td>{row.payment ? <Chip variant="caption" color={paymentColor[row.payment]}>{row.payment}</Chip> : "—"}</td>
                  <td>{row.closure ? shortDate(row.closure) : "—"}</td>
                </>
              )}
            </tr>
          ))}
          {!rows.length && <tr><td className="bp-empty" colSpan={mode === "opportunity" ? 7 : 6}>Nothing in this brand matches.</td></tr>}
        </tbody>
      </table>
  );
}

const meetingTimes = Array.from({ length: 49 }, (_, index) => {
  const minutes = 9 * 60 + index * 15;
  const hours = Math.floor(minutes / 60);
  return `${hours % 12 || 12}:${String(minutes % 60).padStart(2, "0")} ${hours >= 12 ? "PM" : "AM"}`;
});

function dateFromISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function isoFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function calendarDateFromISO(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  return new CalendarDate(year, month, day);
}

function meetingCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const total = Math.ceil((first.getDay() + count) / 7) * 7;
  const start = new Date(first.getFullYear(), first.getMonth(), 1 - first.getDay());
  return Array.from({ length: total }, (_, index) => new Date(start.getFullYear(), start.getMonth(), start.getDate() + index));
}

function emptyMeeting(brandId: Meeting["brandId"], brandName: string, userName: string, opportunity?: Opportunity, date = reviewDate): Meeting {
  return {
    id: "__new__",
    brandId,
    createdBy: "Brand",
    opportunityId: opportunity?.id ?? "",
    title: "",
    date,
    time: "11:00 AM – 12:00 PM",
    kind: "Virtual",
    meetLink: "",
    place: "",
    status: "Upcoming",
    participants: [...(opportunity ? [{ name: opportunity.contact, side: "Customer" }] : []), { name: userName, side: brandName }],
    agenda: [],
    feedback: "",
    followUps: [],
    mom: "",
  };
}

function MeetingCalendar({ meetings, brandId, brandName, opportunities: rows, userName, focusId, onSave, onUpdate }: { meetings: Meeting[]; brandId: Meeting["brandId"]; brandName: string; opportunities: Opportunity[]; userName: string; focusId?: string; onSave: (meeting: Meeting) => void; onUpdate: (meeting: Meeting) => void }) {
  const [month, setMonth] = useState(() => { const date = dateFromISO(reviewDate); return new Date(date.getFullYear(), date.getMonth(), 1); });
  const [selectedDate, setSelectedDate] = useState(reviewDate);
  const [detail, setDetail] = useState<Meeting | null>(null);
  const [detailPosition, setDetailPosition] = useState({ left: 24, top: 100, anchorTop: 100, bounds: { left: 0, right: 360, top: 0, bottom: 720 } });
  const [form, setForm] = useState<Meeting | null>(null);
  const days = meetingCalendarDays(month);
  const monthLabel = month.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const changeMonth = (delta: number) => setMonth(current => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  const openForm = (meeting?: Meeting) => setForm(meeting ?? emptyMeeting(brandId, brandName, userName, rows[0], selectedDate));

  useEffect(() => {
    const meeting = meetings.find(item => item.id === focusId);
    if (!meeting) return;
    const date = dateFromISO(meeting.date);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setSelectedDate(meeting.date);
    setDetailPosition({ left: Math.max(12, window.innerWidth / 2 - 180), top: Math.max(24, window.innerHeight / 2 - 220), anchorTop: window.innerHeight / 2 - 240, bounds: { left: 0, right: window.innerWidth, top: 0, bottom: window.innerHeight } });
    setDetail(meeting);
  }, [focusId, meetings]);

  function openDetails(meeting: Meeting, target: HTMLButtonElement) {
    const rect = target.getBoundingClientRect();
    const board = target.closest(".bp-calendar-board")?.getBoundingClientRect();
    const weekdayHeader = target.closest(".bp-calendar-board")?.querySelector(".bp-calendar-weekdays")?.getBoundingClientRect();
    const bounds = {
      left: Math.max(0, board?.left ?? 0),
      right: Math.min(window.innerWidth, board?.right ?? window.innerWidth),
      top: Math.max(0, weekdayHeader?.bottom ? weekdayHeader.bottom + 8 : board?.top ?? 0),
      bottom: Math.min(window.innerHeight, board?.bottom ?? window.innerHeight),
    };
    setDetailPosition({
      left: rect.left,
      top: rect.bottom + 8,
      anchorTop: rect.top,
      bounds,
    });
    setDetail(meeting);
  }

  function saveMeeting(next: Meeting) {
    const withId = next.id === "__new__" ? { ...next, id: `MTG-${brandId.toUpperCase()}-${Date.now()}` } : next;
    if (next.id === "__new__") onSave(withId);
    else onUpdate(withId);
    setSelectedDate(withId.date);
    const date = dateFromISO(withId.date);
    setMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    setForm(null);
  }

  return (
    <>
      <section className="bp-calendar-board" aria-label="Meeting calendar">
        <header className="bp-calendar-board-head">
          <div className="bp-calendar-heading"><h3>Meetings</h3></div>
          <div className="bp-calendar-controls">
            <button type="button" aria-label="Previous month" onClick={() => changeMonth(-1)}><RiArrowLeftSLine /></button>
            <strong>{monthLabel}</strong>
            <button type="button" aria-label="Next month" onClick={() => changeMonth(1)}><RiArrowRightSLine /></button>
          </div>
        </header>
        <div className="bp-calendar-overflow">
          <div className="bp-calendar-weekdays">{weekdays.map(day => <span key={day}>{day}</span>)}</div>
          <div className="bp-calendar-grid">
            {days.map(date => {
              const dateKey = isoFromDate(date);
              const dayMeetings = meetings.filter(item => item.date === dateKey).sort((a, b) => a.time.localeCompare(b.time));
              const inMonth = date.getMonth() === month.getMonth();
              return (
                <article key={dateKey} className={`bp-calendar-day${inMonth ? "" : " is-adjacent"}${selectedDate === dateKey ? " is-current" : ""}`}>
                  <button type="button" className="bp-calendar-day-number" aria-label={`Select ${date.toLocaleDateString("en-US", { dateStyle: "full" })}`} aria-pressed={selectedDate === dateKey} onClick={() => { setSelectedDate(dateKey); if (!inMonth) setMonth(new Date(date.getFullYear(), date.getMonth(), 1)); }}>{date.getDate()}</button>
                  <div className="bp-calendar-events">
                    {dayMeetings.slice(0, 3).map((meeting, index) => <button key={meeting.id} type="button" className={`bp-calendar-event is-color-${index % 4}`} onClick={event => openDetails(meeting, event.currentTarget)}><span>{meeting.title}</span><time>{meeting.time.split(" – ")[0]}</time></button>)}
                    {dayMeetings.length > 3 && <button className="bp-calendar-more" type="button" onClick={event => openDetails(dayMeetings[3], event.currentTarget)}>+{dayMeetings.length - 3} more</button>}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
      {detail && <MeetingEventPopover meeting={detail} position={detailPosition} onClose={() => setDetail(null)} onEdit={() => { setDetail(null); openForm(detail); }} />}
      {form && <MeetingForm key={form.id === "__new__" ? `new-${form.date}` : form.id} meeting={form} opportunities={rows} brandName={brandName} onClose={() => setForm(null)} onSave={saveMeeting} />}
    </>
  );
}

function MeetingEventPopover({ meeting, position, onClose, onEdit }: { meeting: Meeting; position: { left: number; top: number; anchorTop: number; bounds: { left: number; right: number; top: number; bottom: number } }; onClose: () => void; onEdit: () => void }) {
  const popoverRef = useRef<HTMLElement>(null);
  const [popoverPosition, setPopoverPosition] = useState({ left: position.left, top: position.top });
  const [popoverSize, setPopoverSize] = useState({ width: 360, maxHeight: 600 });
  const dateLabel = dateFromISO(meeting.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const meetCode = meeting.meetLink.split("/").filter(Boolean).at(-1);
  useLayoutEffect(() => {
    const element = popoverRef.current;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const gap = 12;
    const width = Math.max(0, Math.min(360, position.bounds.right - position.bounds.left - gap * 2));
    const maxHeight = Math.max(0, Math.min(window.innerHeight - gap * 2, position.bounds.bottom - position.bounds.top - gap * 2));
    const left = Math.max(position.bounds.left + gap, Math.min(position.left, position.bounds.right - rect.width - gap));
    let top = position.top;
    if (top + rect.height > position.bounds.bottom - gap) top = position.anchorTop - rect.height - 8;
    top = Math.max(position.bounds.top + gap, Math.min(top, position.bounds.bottom - rect.height - gap));
    setPopoverSize({ width, maxHeight });
    setPopoverPosition({ left, top });
  }, [meeting, position]);
  return (
    <div className="bp-meeting-popover-layer" onKeyDown={event => { if (event.key === "Escape") onClose(); }}>
      <button className="bp-meeting-popover-dismiss" type="button" aria-label="Close meeting details" onClick={onClose} />
      <section ref={popoverRef} className="bp-meeting-popover" role="dialog" aria-label={`${meeting.title} details`} style={{ left: popoverPosition.left, top: popoverPosition.top, width: popoverSize.width, maxHeight: popoverSize.maxHeight }}>
        <header className="bp-meeting-popover-heading"><strong>{meeting.title}</strong><span>{dateLabel}</span></header>
        {meeting.kind === "Virtual" ? <div className="bp-event-meet"><span><img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Meet_icon_%282026%29.svg" alt="" /><span><strong>Google Meet</strong><small>{meetCode || "Meeting link not added"}</small></span></span>{meeting.meetLink && <a href={meeting.meetLink} target="_blank" rel="noreferrer">Join</a>}</div> : <div className="bp-event-location"><RiMapPin2Line /><span><small>Location</small><strong>{meeting.place || "Location not added"}</strong></span></div>}
        <div className="bp-event-time"><RiTimeLine /><strong>{meeting.time}</strong></div>
        <section className="bp-event-section"><h4><RiGroupLine />Participants</h4><div className="bp-event-people">{meeting.participants.map(person => <span key={`${person.name}-${person.side}`}><i>{initials(person.name)}</i><strong>{person.name}</strong></span>)}</div></section>
        <footer className="bp-meeting-popover-actions"><button type="button" className="bp-event-close" onClick={onClose}>Close</button>{meeting.createdBy === "Brand" && <button type="button" className="bp-event-edit" onClick={onEdit}>Edit meeting</button>}</footer>
      </section>
    </div>
  );
}

function MeetingForm({ meeting, opportunities: rows, brandName, onClose, onSave }: { meeting: Meeting; opportunities: Opportunity[]; brandName: string; onClose: () => void; onSave: (meeting: Meeting) => void }) {
  const [draft, setDraft] = useState(meeting);
  const [start = "11:00 AM", end = "12:00 PM"] = draft.time.split(/\s+[–-]\s+/);
  const editing = draft.id !== "__new__";
  const validTime = meetingTimes.indexOf(end) > meetingTimes.indexOf(start);
  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.title.trim() || !validTime) return;
    onSave({ ...draft, title: draft.title.trim(), time: `${start} – ${end}`, participants: meeting.participants, agenda: draft.agenda.map(item => item.trim()).filter(Boolean) });
  }
  return (
    <Modal className="bp-meeting-modal bp-meeting-form-modal" isOpen onOpenChange={isOpen => { if (!isOpen) onClose(); }} size="wide" aria-label={editing ? "Edit meeting" : "Schedule a meeting"}>
      <ModalHeader title={editing ? "Edit meeting" : "Schedule a meeting"} description={`${brandName} · Add the date, time and meeting details.`} />
      <ModalBody>
        <div className="bp-meeting-content">
          <div className="bp-meeting-date-calendar"><DateCalendar aria-label="Meeting date" value={calendarDateFromISO(draft.date)} onChange={date => setDraft(current => ({ ...current, date: date.toString() }))} /></div>
          <form id="bp-meeting-form" className="bp-meeting-form" onSubmit={save}>
            <label><span>Meeting title</span><input required value={draft.title} onChange={event => setDraft(current => ({ ...current, title: event.target.value }))} placeholder="e.g. Franchise discussion" /></label>
            <label><span>Related opportunity</span><BoardSelect aria-label="Related opportunity" selectedKey={draft.opportunityId || "__none__"} onSelectionChange={key => setDraft(current => ({ ...current, opportunityId: String(key) === "__none__" ? "" : String(key) }))} className="bp-meeting-form-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit"><SelectItem id="__none__">No opportunity selected</SelectItem>{rows.map(item => <SelectItem key={item.id} id={item.id}>{item.customer} · {item.id}</SelectItem>)}</BoardSelect></label>
            <div className="bp-meeting-time-fields"><label><span>Start time</span><BoardSelect aria-label="Start time" selectedKey={start} onSelectionChange={key => setDraft(current => ({ ...current, time: `${String(key)} – ${end}` }))} className="bp-meeting-form-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">{meetingTimes.slice(0, -1).map(time => <SelectItem key={time} id={time}>{time}</SelectItem>)}</BoardSelect></label><label><span>End time</span><BoardSelect aria-label="End time" selectedKey={end} onSelectionChange={key => setDraft(current => ({ ...current, time: `${start} – ${String(key)}` }))} className="bp-meeting-form-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">{meetingTimes.slice(1).map(time => <SelectItem key={time} id={time}>{time}</SelectItem>)}</BoardSelect></label></div>
            <label><span>Meeting type</span><BoardSelect aria-label="Meeting type" selectedKey={draft.kind} onSelectionChange={key => setDraft(current => ({ ...current, kind: String(key) as Meeting["kind"] }))} className="bp-meeting-form-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit"><SelectItem id="Virtual">Virtual</SelectItem><SelectItem id="In-person">In-person</SelectItem></BoardSelect></label>
            {draft.kind === "Virtual" ? <label><span>Google Meet link</span><input type="url" value={draft.meetLink} onChange={event => setDraft(current => ({ ...current, meetLink: event.target.value }))} placeholder="https://meet.google.com/..." /></label> : <label><span>Meeting location</span><input value={draft.place} onChange={event => setDraft(current => ({ ...current, place: event.target.value }))} placeholder="Address or office location" /> </label>}
            <label><span>Participants</span><div className="bp-event-people">{meeting.participants.map(person => <span key={`${person.name}-${person.side}`}><i>{initials(person.name)}</i><strong>{person.name}</strong></span>)}</div></label>
            <label className="bp-meeting-form-wide"><span>Agenda</span><textarea value={draft.agenda.join("\n")} onChange={event => setDraft(current => ({ ...current, agenda: event.target.value.split("\n") }))} placeholder="One item per line" /></label>
            {!validTime && <p className="bp-meeting-form-error">Choose an end time after the start time.</p>}
          </form>
        </div>
      </ModalBody>
      <ModalFooter><button type="button" className="bp-event-close" onClick={onClose}>Cancel</button><button type="submit" form="bp-meeting-form" className="bp-event-edit" disabled={!validTime}>{editing ? "Save changes" : "Schedule meeting"}</button></ModalFooter>
    </Modal>
  );
}

function Pager({ page, pages, total, onPage }: { page: number; pages: number; total: number; onPage: (page: number) => void }) {
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, total);
  const labels = Array.from({ length: pages }, (_, index) => index + 1);
  return (
    <div className="bp-pager">
      <span>Showing {start}–{end} of {total}</span>
      <div className="bp-pages">
        <button aria-label="Previous page" disabled={page === 1} onClick={() => onPage(page - 1)}><RiArrowLeftSLine className="size-4" /></button>
        {labels.map(item => <button key={item} aria-current={item === page ? "page" : undefined} onClick={() => onPage(item)}>{item}</button>)}
        <button aria-label="Next page" disabled={page === pages} onClick={() => onPage(page + 1)}><RiArrowRightSLine className="size-4" /></button>
      </div>
    </div>
  );
}

function InvoicePanel({ tab, onTab, brandName, invoices: rows, docs, focusId, onOpen, onDownload }: { tab: "Invoices" | "Documents"; onTab: (tab: "Invoices" | "Documents") => void; brandName: string; invoices: Invoice[]; docs: BrandDocument[]; focusId?: string; onOpen: (id: string) => void; onDownload: (invoice: Invoice) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("All Status");
  const [dateRange, setDateRange] = useState("All dates");
  const [preview, setPreview] = useState<Invoice | null>(null);
  const [documentPreview, setDocumentPreview] = useState<BrandDocument | null>(null);
  useEffect(() => {
    if (!focusId) return;
    const invoice = rows.find(item => item.id === focusId);
    if (invoice) { setPreview(invoice); setDocumentPreview(null); return; }
    const document = docs.find(item => item.id === focusId);
    if (document) { setDocumentPreview(document); setPreview(null); }
  }, [focusId, rows, docs]);
  const today = new Date(`${reviewDate}T00:00:00`);
  const inDateRange = (iso: string) => {
    if (dateRange === "All dates") return true;
    const date = new Date(`${iso}T00:00:00`);
    const day = 24 * 60 * 60 * 1000;
    if (dateRange === "This month") return date.getFullYear() === today.getFullYear() && date.getMonth() === today.getMonth();
    if (dateRange === "Last 30 days") return date <= today && date >= new Date(today.getTime() - 30 * day);
    return date.getFullYear() === today.getFullYear();
  };
  const invoiceRows = rows.filter(item => {
    const haystack = `${item.id} ${item.opportunityId}`.toLowerCase();
    return (status === "All Status" || item.status === status) && inDateRange(item.date) && haystack.includes(query.trim().toLowerCase());
  });
  const documentRows = docs.filter(item => {
    const haystack = `${item.id} ${item.name} ${item.party} ${item.opportunityId}`.toLowerCase();
    return (status === "All Status" || item.status === status) && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <section className="bp-invoice-panel">
      <div className="bp-invoice-heading-row">
        <header className="bp-hello"><div><h2>Invoices &amp; Documents</h2><p>Invoices and approved files for {brandName} only.</p></div></header>
        <div className="bp-invoice-tabs" role="tablist" aria-label="Invoices and documents">
          <button role="tab" aria-selected={tab === "Invoices"} className={tab === "Invoices" ? "is-active" : ""} onClick={() => { onTab("Invoices"); setStatus("All Status"); setQuery(""); setDateRange("All dates"); }}><RiFileTextLine />Invoices <span>({rows.length})</span></button>
          <button role="tab" aria-selected={tab === "Documents"} className={tab === "Documents" ? "is-active" : ""} onClick={() => { onTab("Documents"); setStatus("All Status"); setQuery(""); setDateRange("All dates"); }}><RiFolderLine />Documents <span>({docs.length})</span></button>
        </div>
      </div>
      <div className="bp-invoice-card">
        <div className={`bp-invoice-filters${tab === "Invoices" ? " has-date" : ""}`}>
          <label className="bp-invoice-search"><RiSearchLine /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={tab === "Invoices" ? "Search invoices..." : "Search documents..."} aria-label={tab === "Invoices" ? "Search invoices" : "Search documents"} /></label>
          {tab === "Invoices" && <BoardSelect aria-label="Filter invoices by date" selectedKey={dateRange} onSelectionChange={key => setDateRange(String(key))} className="bp-invoice-filter-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
            {["All dates", "This month", "Last 30 days", "This year"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
          </BoardSelect>}
          <BoardSelect aria-label="Filter by status" selectedKey={status} onSelectionChange={key => setStatus(String(key))} className="bp-invoice-filter-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">
            {["All Status", ...(tab === "Invoices" ? ["Paid", "Partially Paid", "Pending"] : ["Approved", "Pending"])].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}
          </BoardSelect>
        </div>
      {tab === "Invoices" ? (
        <div className="bp-table-card bp-invoice-table-wrap"><table className="bp-table bp-invoice-table is-invoices">
          <thead><tr>{["Invoice No", "Opportunity Ref", "Invoice Date", "Amount", "Status", "Action"].map(item => <th key={item}>{item}</th>)}</tr></thead>
          <tbody>
            {invoiceRows.map(row => (
              <tr key={row.id}>
                <td><span className="bp-invoice-id"><i><RiFileTextLine /></i><b>{row.id}</b></span></td>
                <td>{row.opportunityId}</td>
                <td>{shortDate(row.date)}</td>
                <td>{inr(row.amount)}</td>
                <td><span className={`bp-status-pill is-${row.status.toLowerCase().replaceAll(" ", "-")}`}><i />{row.status}</span></td>
                <td><div className="bp-row-actions"><button aria-label={`Download ${row.id}`} title="Download invoice" onClick={() => onDownload(row)}><RiDownloadLine /></button><button aria-label={`Preview ${row.id}`} title="Preview invoice" onClick={() => setPreview(row)}><RiEyeLine /></button></div></td>
              </tr>
            ))}
            {!invoiceRows.length && <tr><td className="bp-empty" colSpan={6}>No invoices match these filters.</td></tr>}
          </tbody>
        </table></div>
      ) : (
        <div className="bp-table-card bp-invoice-table-wrap"><table className="bp-table bp-invoice-table is-documents">
          <thead><tr>{["Document", "Opportunity Ref", "Party", "Status", "Action"].map(item => <th key={item}>{item}</th>)}</tr></thead>
          <tbody>
            {documentRows.map(item => <tr key={item.id}>
              <td><span className="bp-invoice-id"><i><RiFolderLine /></i><b>{item.name}</b></span></td>
              <td>{item.opportunityId}</td><td>{item.party}</td>
              <td><span className={`bp-status-pill is-${item.status.toLowerCase()}`}><i />{item.status}</span></td>
              <td><div className="bp-row-actions"><button aria-label={`View ${item.name}`} title="View related opportunity" onClick={() => onOpen(item.opportunityId)}><RiEyeLine /></button></div></td>
            </tr>)}
            {!documentRows.length && <tr><td className="bp-empty" colSpan={5}>No documents match these filters.</td></tr>}
          </tbody>
        </table></div>
      )}
        <div className="bp-invoice-footer"><span>Showing {tab === "Invoices" ? invoiceRows.length : documentRows.length} of {tab === "Invoices" ? rows.length : docs.length} {tab.toLowerCase()}</span><div><button disabled aria-label="Previous page"><RiArrowLeftSLine /></button><button aria-current="page">1</button><button disabled aria-label="Next page"><RiArrowRightSLine /></button></div></div>
      </div>
      {preview && <Modal className="bp-invoice-preview-modal" isOpen onOpenChange={isOpen => { if (!isOpen) setPreview(null); }} size="md" aria-label={`Invoice ${preview.id} preview`}>
        <ModalHeader title="Invoice preview" description={`${brandName} · ${preview.id}`} />
        <ModalBody>
          <article className="bp-invoice-preview-sheet">
            <div className="bp-invoice-preview-brand"><span>iFranchise</span><span>INVOICE</span></div>
            <div className="bp-invoice-preview-number"><strong>{preview.id}</strong><span>{shortDate(preview.date)}</span></div>
            <div className="bp-invoice-preview-line"><span>Opportunity reference</span><strong>{preview.opportunityId}</strong></div>
            <div className="bp-invoice-preview-line"><span>Payment status</span><strong>{preview.status}</strong></div>
            <div className="bp-invoice-preview-total"><span>Total due</span><strong>{inr(preview.amount)}</strong></div>
          </article>
        </ModalBody>
        <ModalFooter><button type="button" className="bp-event-close" onClick={() => setPreview(null)}>Close</button><button type="button" className="bp-event-edit" onClick={() => onDownload(preview)}><RiDownloadLine />Download</button></ModalFooter>
      </Modal>}
      {documentPreview && <Modal className="bp-invoice-preview-modal" isOpen onOpenChange={isOpen => { if (!isOpen) setDocumentPreview(null); }} size="md" aria-label={`${documentPreview.name} preview`}>
        <ModalHeader title="Document preview" description={`${brandName} · ${documentPreview.id}`} />
        <ModalBody><article className="bp-invoice-preview-sheet"><div className="bp-invoice-preview-brand"><span>iFranchise</span><span>DOCUMENT</span></div><div className="bp-invoice-preview-number"><strong>{documentPreview.name}</strong><span>{documentPreview.status}</span></div><div className="bp-invoice-preview-line"><span>Opportunity reference</span><strong>{documentPreview.opportunityId}</strong></div><div className="bp-invoice-preview-line"><span>Shared with</span><strong>{documentPreview.party}</strong></div></article></ModalBody>
        <ModalFooter><button type="button" className="bp-event-close" onClick={() => setDocumentPreview(null)}>Close</button><button type="button" className="bp-event-edit" onClick={() => { setDocumentPreview(null); onOpen(documentPreview.opportunityId); }}>View opportunity</button></ModalFooter>
      </Modal>}
    </section>
  );
}

function OpportunityScrollRegion({ children, className }: { children: ReactNode; className?: string }) {
  const fade = useScrollFade();
  return <div className={cx("bp-opportunity-scroll-region", className)}><div className="bp-opportunity-scroll-content" onScroll={fade.onScroll}>{children}</div><ScrollFade progress={fade.progress} surfaceClassName="from-background-primary-default" /></div>;
}

function OpportunityTimeSelect({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <label className="bp-opportunity-time-control"><span>Time</span><BoardSelect aria-label="Time" selectedKey={value} onSelectionChange={key => onChange(String(key))} className="bp-opportunity-time-select" triggerClassName="bp-opportunity-time-trigger" popoverClassName="bp-menu-fit">{["All Time", "Today", "Last 7 days", "Last 30 days"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</BoardSelect></label>;
}

function OpportunityDetail({ opportunity, returnLabel, brandName, coordinator, meetings, invoices: bills, docs, onBack, onDownload }: { opportunity: Opportunity; returnLabel: string; brandName: string; coordinator: string; meetings: Meeting[]; invoices: Invoice[]; docs: BrandDocument[]; onBack: () => void; onDownload: (invoice: Invoice) => void }) {
  const [tab, setTab] = useState("Recent Activity");
  const [pipelineVisible, setPipelineVisible] = useState(false);
  const [timeFilter, setTimeFilter] = useState("All Time");
  const [invoicePreview, setInvoicePreview] = useState<Invoice | null>(null);
  const [documentPreview, setDocumentPreview] = useState<BrandDocument | null>(null);
  useEffect(() => { setTab("Recent Activity"); setPipelineVisible(false); setTimeFilter("All Time"); }, [opportunity.id]);
  const stageIndex = stages.indexOf(opportunity.stage);
  const leadOwner = coordinator === "Himani" ? "Himani Bhargava Tapadiya" : coordinator;
  const ownerPortrait = portraitFor(leadOwner);
  const emailLabel = maskOpportunityEmail(opportunity.email);
  const phoneLabel = maskOpportunityPhone(opportunity.phone);
  const leadAgeDays = Math.max(0, Math.floor((new Date(`${reviewDate}T00:00:00`).getTime() - new Date(`${opportunity.created}T00:00:00`).getTime()) / 86_400_000));
  const recentActivity: { id: string; label: string; detail: string; date: string; icon: ReactNode; meeting?: Meeting; invoice?: Invoice; document?: BrandDocument }[] = [
    { id: "activity", label: opportunity.activity, detail: `${opportunity.customer} · ${shortDate(opportunity.created)}`, date: opportunity.created, icon: <RiTimeLine /> },
    { id: "shared", label: `Opportunity shared with ${brandName}`, detail: shortDate(opportunity.created), date: opportunity.created, icon: <RiStackLine /> },
    ...meetings.map(item => ({ id: item.id, label: item.status === "Upcoming" ? `Meeting scheduled: ${item.title}` : `Meeting completed: ${item.title}`, detail: `${item.time} · ${shortDate(item.date)}`, date: item.date, icon: <RiCalendarLine />, meeting: item })),
    ...bills.map(item => ({ id: item.id, label: `Invoice ${item.id} · ${item.status}`, detail: `${inr(item.amount)} · ${shortDate(item.date)}`, date: item.date, icon: <RiFileTextLine />, invoice: item })),
    ...docs.map(item => ({ id: item.id, label: `${item.name} · ${item.status}`, detail: `Shared with ${item.party}`, date: opportunity.created, icon: <RiFolderLine />, document: item })),
  ].sort((a, b) => b.date.localeCompare(a.date));
  const visibleActivity = recentActivity.filter(item => opportunityMatchesTimeRange(item.date, timeFilter));
  const visibleBills = bills.filter(item => opportunityMatchesTimeRange(item.date, timeFilter));
  const visibleDocs = docs.filter(() => opportunityMatchesTimeRange(opportunity.created, timeFilter));
  return (
    <div className="bp-opportunity-detail">
      <header className="bp-opportunity-detail-topbar"><button className="bp-back" onClick={onBack} aria-label={`Back to ${returnLabel}`}><RiArrowLeftLine /></button><h2>Opportunity Details</h2><button className="bp-opportunity-pipeline-toggle" type="button" aria-expanded={pipelineVisible} onClick={() => setPipelineVisible(value => !value)}><RiStackLine />{pipelineVisible ? "Hide Pipeline" : "View Pipeline"}</button></header>
      {pipelineVisible && <section className="bp-card bp-opportunity-stage-card" aria-label={`Opportunity stage: ${opportunity.stage}`}>
        <div className="bp-opportunity-stage-heading"><span><strong>Opportunity Pipeline</strong><small>Current stage for this opportunity</small></span><Chip variant="caption" color={stageColor[opportunity.stage]}>{opportunity.stage}</Chip></div>
        <div className="bp-opportunity-stage-track">{stages.map((item, index) => <div className={`bp-opportunity-stage-step${index < stageIndex ? " is-complete" : index === stageIndex ? " is-current" : ""}`} key={item}><i>{index + 1}</i><small>{item}</small></div>)}</div>
      </section>}
      <div className="bp-opportunity-detail-layout">
        <aside className="bp-opportunity-profile-column">
          <section className="bp-card bp-opportunity-profile-card">
            <span className="bp-opportunity-avatar">{initials(opportunity.customer)}</span>
            <h2>{opportunity.customer}</h2>
            <small>{opportunity.id}</small>
            <div className="bp-opportunity-profile-contacts">
              <span><RiMailLine /><bdi dir="ltr">{emailLabel}</bdi></span>
              <span><RiPhoneLine /><bdi dir="ltr">{phoneLabel}</bdi></span>
              <span><RiStore2Line /><b><small>Brand</small>{brandName}</b></span>
            </div>
            <div className="bp-opportunity-profile-stats"><div><strong>{meetings.length}</strong><small>Meetings</small></div><div><strong>{bills.length}</strong><small>Invoices</small></div><div><strong>{docs.length}</strong><small>Documents</small></div></div>
          </section>
          <section className="bp-card bp-opportunity-owner-card"><h3>Lead Owner</h3><div>{ownerPortrait ? <img src={ownerPortrait} alt="" /> : <span className="bp-owner-initials">{initials(leadOwner)}</span>}<strong>{leadOwner}</strong></div></section>
          <section className="bp-card bp-opportunity-social-card"><h3><RiGlobalLine />Lead Social Profiles</h3><div className="bp-opportunity-social-links" aria-label="Lead social profile platforms">{socialPlatforms.map(({ name, Icon }) => <span key={name} role="img" aria-label={name} title={name}><Icon /></span>)}</div></section>
        </aside>
        <main className="bp-opportunity-detail-main">
          <nav className="bp-opportunity-detail-tabs" role="tablist" aria-label="Opportunity details">
            {["Recent Activity", "Additional Details", "Invoices", "Documents"].map(item => <button key={item} type="button" role="tab" aria-selected={tab === item} onClick={() => setTab(item)}>{item}</button>)}
          </nav>
      {tab === "Recent Activity" ? <>
        <section className="bp-card bp-opportunity-recent-activity"><div className="bp-card-head"><h3><RiTimeLine />Recent Activity</h3><OpportunityTimeSelect value={timeFilter} onChange={setTimeFilter} /></div><OpportunityScrollRegion><div className="bp-detail-rows bp-scroll-rows">{visibleActivity.map(item => <div className="bp-overview-activity-row" key={item.id}><i>{item.icon}</i><span><strong>{item.label}</strong><small>{item.detail}</small>{item.meeting?.meetLink && <a className="bp-opportunity-activity-link" href={item.meeting.meetLink} target="_blank" rel="noreferrer">Join meeting <RiExternalLinkLine /></a>}{item.invoice && <button className="bp-opportunity-activity-link" type="button" onClick={() => setInvoicePreview(item.invoice!)}>View invoice</button>}{item.document && <button className="bp-opportunity-activity-link" type="button" onClick={() => setDocumentPreview(item.document!)}>View document</button>}</span></div>)}{!visibleActivity.length && <p className="bp-empty">No recent activity in this time range.</p>}</div></OpportunityScrollRegion></section>
      </> : tab === "Additional Details" ? <>
        <section className="bp-card bp-opportunity-additional-card"><div className="bp-card-head"><h3><RiStackLine />Additional Details</h3></div><dl className="bp-opportunity-additional-grid">
          <div><dt>Investment Capacity</dt><dd>—</dd></div><div><dt>Interested Brand</dt><dd>{brandName}</dd></div>
          <div><dt>Location</dt><dd>{opportunity.city}</dd></div><div><dt>Enquiry Date</dt><dd>{shortDate(opportunity.created)}</dd></div>
          <div><dt>Lead Type</dt><dd>Franchise</dd></div><div><dt>Requirement</dt><dd>—</dd></div>
          <div><dt>Lead Age</dt><dd>{leadAgeDays} days</dd></div>
          <div><dt>Lead Source</dt><dd>—</dd></div><div><dt>How they heard about us</dt><dd>—</dd></div>
          <div><dt>Campaign</dt><dd>—</dd></div><div><dt>Recorded by</dt><dd>—</dd></div>
          <div><dt>Approved Deal Value</dt><dd>{opportunity.dealValue != null ? inr(opportunity.dealValue) : "—"}</dd></div>
          <div><dt>Payment Status</dt><dd>{opportunity.payment ? <span className={`bp-payment-tag is-${opportunity.payment.toLowerCase().replaceAll(" ", "-")}`}>{opportunity.payment}</span> : "—"}</dd></div>
        </dl></section>
      </> : tab === "Invoices" ? <>
        <section className="bp-card bp-opportunity-support-card"><div className="bp-card-head"><h3><RiFileTextLine />Invoices ({visibleBills.length})</h3><OpportunityTimeSelect value={timeFilter} onChange={setTimeFilter} /></div><OpportunityScrollRegion><div className="bp-opportunity-data-table" role="table" aria-label="Opportunity invoices"><div className="bp-opportunity-data-header is-invoice" role="row"><span role="columnheader">Invoice</span><span role="columnheader">Amount</span><span role="columnheader">Status</span><span role="columnheader">Issued On</span><span role="columnheader" aria-label="Actions" /></div>{visibleBills.map(item => <div className="bp-opportunity-data-row is-invoice" role="row" key={item.id}><span className="bp-opportunity-invoice-id" role="cell"><RiFileTextLine /><strong>{item.id}</strong></span><span role="cell">{inr(item.amount)}</span><span role="cell"><span className={`bp-payment-tag is-${item.status.toLowerCase().replaceAll(" ", "-")}`}>{item.status}</span></span><span role="cell">{shortDate(item.date)}</span><span className="bp-opportunity-row-menu" role="cell"><Dropdown><DropdownTrigger className="bp-opportunity-row-menu-trigger" aria-label={`Actions for invoice ${item.id}`}>···</DropdownTrigger><DropdownPopover aria-label={`Actions for invoice ${item.id}`} placement="bottom end" className="w-[170px]" dialogClassName="gap-1"><DropdownItem onSelect={() => setInvoicePreview(item)}><RiEyeLine />View</DropdownItem><DropdownItem onSelect={() => onDownload(item)}><RiDownloadLine />Download</DropdownItem></DropdownPopover></Dropdown></span></div>)}{!visibleBills.length && <p className="bp-empty">No invoices match this time range.</p>}</div></OpportunityScrollRegion></section>
      </> : tab === "Documents" ? <>
        <section className="bp-card bp-opportunity-support-card"><div className="bp-card-head"><h3><RiFolderLine />Documents ({visibleDocs.length})</h3><OpportunityTimeSelect value={timeFilter} onChange={setTimeFilter} /></div><OpportunityScrollRegion><div className="bp-opportunity-data-table" role="table" aria-label="Opportunity documents"><div className="bp-opportunity-data-header is-document" role="row"><span role="columnheader">Name</span><span role="columnheader">Size</span><span role="columnheader">Uploaded By</span><span role="columnheader">Uploaded On</span><span role="columnheader" aria-label="Actions" /></div>{visibleDocs.map(item => <div className="bp-opportunity-data-row is-document" role="row" key={item.id}><span className="bp-detail-doc-name" role="cell"><i><RiFolderLine /></i><strong>{item.name}</strong></span><span role="cell">—</span><span role="cell">—</span><span role="cell">—</span><span className="bp-opportunity-row-menu" role="cell"><Dropdown><DropdownTrigger className="bp-opportunity-row-menu-trigger" aria-label={`Actions for document ${item.name}`}>···</DropdownTrigger><DropdownPopover aria-label={`Actions for document ${item.name}`} placement="bottom end" className="w-[170px]" dialogClassName="gap-1"><DropdownItem onSelect={() => setDocumentPreview(item)}><RiEyeLine />View</DropdownItem><DropdownItem onSelect={() => downloadBrandDocument(item)}><RiDownloadLine />Download</DropdownItem></DropdownPopover></Dropdown></span></div>)}{!visibleDocs.length && <p className="bp-empty">No documents match this time range.</p>}</div></OpportunityScrollRegion></section>
      </> : null}
        </main>
      </div>
      {invoicePreview && <Modal className="bp-invoice-preview-modal" isOpen onOpenChange={isOpen => { if (!isOpen) setInvoicePreview(null); }} size="md" aria-label={`Invoice ${invoicePreview.id} preview`}><ModalHeader title="Invoice preview" description={`${brandName} · ${invoicePreview.id}`} /><ModalBody><article className="bp-invoice-preview-sheet"><div className="bp-invoice-preview-brand"><span>iFranchise</span><span>INVOICE</span></div><div className="bp-invoice-preview-number"><strong>{invoicePreview.id}</strong><span>{shortDate(invoicePreview.date)}</span></div><div className="bp-invoice-preview-line"><span>Opportunity reference</span><strong>{invoicePreview.opportunityId}</strong></div><div className="bp-invoice-preview-line"><span>Payment status</span><strong>{invoicePreview.status}</strong></div><div className="bp-invoice-preview-total"><span>Total due</span><strong>{inr(invoicePreview.amount)}</strong></div></article></ModalBody><ModalFooter><button type="button" className="bp-event-close" onClick={() => setInvoicePreview(null)}>Close</button><button type="button" className="bp-event-edit" onClick={() => onDownload(invoicePreview)}><RiDownloadLine />Download</button></ModalFooter></Modal>}
      {documentPreview && <Modal className="bp-invoice-preview-modal" isOpen onOpenChange={isOpen => { if (!isOpen) setDocumentPreview(null); }} size="md" aria-label={`${documentPreview.name} preview`}><ModalHeader title="Document preview" description={`${brandName} · ${documentPreview.id}`} /><ModalBody><article className="bp-invoice-preview-sheet"><div className="bp-invoice-preview-brand"><span>iFranchise</span><span>DOCUMENT</span></div><div className="bp-invoice-preview-number"><strong>{documentPreview.name}</strong><span>{documentPreview.status}</span></div><div className="bp-invoice-preview-line"><span>Opportunity reference</span><strong>{documentPreview.opportunityId}</strong></div><div className="bp-invoice-preview-line"><span>Shared with</span><strong>{documentPreview.party}</strong></div></article></ModalBody><ModalFooter><button type="button" className="bp-event-close" onClick={() => setDocumentPreview(null)}>Close</button><button type="button" className="bp-event-edit" onClick={() => downloadBrandDocument(documentPreview)}><RiDownloadLine />Download</button></ModalFooter></Modal>}
    </div>
  );
}

function Reports({ range, onRange, opportunities: rows, meetings, invoices: bills, upcoming, completed, summary, onOpen }: { range: string; onRange: (range: string) => void; opportunities: Opportunity[]; meetings: Meeting[]; invoices: Invoice[]; upcoming: number; completed: number; summary: { total: number; paid: number; pending: number }; onOpen: (view: ViewId) => void }) {
  const [tab, setTab] = useState("Overview");
  const dealValue = rows.reduce((sum, item) => sum + (item.dealValue ?? 0), 0);
  const stageValues = stages.map(item => ({ label: item, value: rows.filter(row => row.stage === item).length }));
  const stageColors = ["#8fa0b7", "#34b26b", "#4285f4", "#f14768", "#f6a313", "#1aa357", "#e3214e"];
  const orderedDates = rows.map(item => item.created).sort();
  const firstDate = orderedDates.length ? new Date(`${orderedDates[0]}T00:00:00`).getTime() : 0;
  const lastDate = orderedDates.length ? new Date(`${orderedDates[orderedDates.length - 1]}T00:00:00`).getTime() : firstDate + 1;
  const interval = Math.max((lastDate - firstDate + 1) / 5, 1);
  const trend = Array.from({ length: 5 }, (_, bin) => rows.filter(item => Math.min(4, Math.floor((new Date(`${item.created}T00:00:00`).getTime() - firstDate) / interval)) === bin).length);
  const trendMax = Math.max(...trend, 1);
  const trendCoords = trend.map((value, index) => ({ x: 34 + index * 132, y: 146 - (value / trendMax) * 104 }));
  const trendLine = trendCoords.reduce((path, point, index) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = trendCoords[index - 1];
    const middle = (previous.x + point.x) / 2;
    return `${path} C ${middle} ${previous.y}, ${middle} ${point.y}, ${point.x} ${point.y}`;
  }, "");
  const trendArea = `${trendLine} L ${trendCoords.at(-1)?.x ?? 562} 170 L ${trendCoords[0]?.x ?? 34} 170 Z`;
  const recent = [...rows].sort((a, b) => b.created.localeCompare(a.created)).slice(0, 5);
  const dealRows = rows.filter(item => item.dealValue != null);

  function downloadReport() {
    const content = [
      ["Metric", "Value"],
      ["Brand opportunities", String(rows.length)],
      ["Upcoming meetings", String(upcoming)],
      ["Completed meetings", String(completed)],
      ["Deal value", String(dealValue)],
      ["Total invoiced", String(summary.total)],
      ["Paid", String(summary.paid)],
      ["Pending", String(summary.pending)],
    ].map(row => row.join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "brand-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="bp-reports">
      <header className="bp-report-heading">
        <div><h2>Reports</h2><p>Performance and business insights for this brand.</p></div>
        <div className="bp-report-actions"><BoardSelect aria-label="Report range" selectedKey={range} onSelectionChange={key => onRange(String(key))} className="bp-report-range-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit">{["Last 7 Days", "Last 30 Days", "This quarter"].map(item => <SelectItem key={item} id={item}>{item}</SelectItem>)}</BoardSelect><button className="bp-report-download" onClick={downloadReport}><RiDownloadLine />Download Report</button></div>
      </header>
      <nav className="bp-report-tabs" aria-label="Report sections">
        {["Overview", "Opportunities", "Meetings", "Deals", "Invoices"].map(item => <button key={item} aria-pressed={tab === item} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      {tab === "Overview" ? <>
        <div className="bp-report-stats">
          <Stat icon={<RiGroupLine />} tone="blue" value={String(rows.length)} label="Total Opportunities" delta="↑ 12%" />
          <Stat icon={<RiCalendarLine />} tone="purple" value={String(upcoming)} label="Upcoming Meetings" delta="↑ 33%" />
          <Stat icon={<RiCalendarLine />} tone="green" value={String(completed)} label="Completed Meetings" delta="↑ 20%" />
          <Stat icon={<RiTrophyLine />} tone="green" value={inr(dealValue)} label="Deal Value" delta="↑ 18%" />
        </div>
        <div className="bp-report-grid">
          <section className="bp-card bp-stage-card">
            <div className="bp-card-head"><div><h3>Opportunity Stage Distribution</h3><p className="bp-note">Pipeline progress by stage.</p></div><span className="bp-stage-total">{rows.length} total</span></div>
            <div className="bp-stage-score-layout">
              <div className="bp-stage-score" role="img" aria-label={`${rows.length} total opportunities across ${stageValues.length} stages`}>
                <div className="bp-stage-score-ring" aria-hidden="true">
                  <svg viewBox="0 0 120 120"><circle className="bp-stage-ring-track" cx="60" cy="60" r="48" />{stageValues.map((item, index) => {
                    const total = rows.length || 1;
                    const segment = (item.value / total) * 100;
                    const offset = stageValues.slice(0, index).reduce((sum, entry) => sum + (entry.value / total) * 100, 0);
                    return <circle key={item.label} className="bp-stage-ring-segment" cx="60" cy="60" r="48" pathLength="100" stroke={stageColors[index]} strokeDasharray={`${Math.max(0, segment - 1)} ${100 - Math.max(0, segment - 1)}`} strokeDashoffset={-offset} />;
                  })}</svg>
                  <span><strong>{rows.length}</strong><small>total</small></span>
                </div>
              </div>
              <div className="bp-stage-breakdown" role="list" aria-label="Opportunity counts by stage">
                {stageValues.map((item, index) => {
                  const percentage = rows.length ? Math.round((item.value / rows.length) * 100) : 0;
                  return <div className="bp-stage-breakdown-row" role="listitem" key={item.label} style={{ animationDelay: `${index * 45}ms` }}>
                    <span className="bp-stage-breakdown-label"><i style={{ backgroundColor: stageColors[index] }} />{item.label}</span>
                    <span className="bp-stage-breakdown-value">{item.value}</span>
                    <span className="bp-stage-breakdown-percent">{percentage}%</span>
                  </div>;
                })}
              </div>
            </div>
          </section>
          <div className="bp-report-side">
            <section className="bp-card bp-payment-card"><h3>Payment Status</h3><div className="bp-money"><div><span>Total Invoiced</span><strong>{inr(summary.total)}</strong></div><div className="is-paid"><span>Paid</span><strong>{inr(summary.paid)}</strong></div><div className="is-due"><span>Pending</span><strong>{inr(summary.pending)}</strong></div></div></section>
            <section className="bp-card bp-trend-card"><div className="bp-card-head"><div><h3>Opportunity Trend</h3><p className="bp-note">New opportunities over time.</p></div><span>{rows.filter(item => item.stage === "Won").length} Won</span></div><svg className="bp-trend-chart" viewBox="0 0 600 190" role="img" aria-label="Opportunity trend over the selected range"><defs><linearGradient id="bp-trend-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#7546ed" stopOpacity=".25" /><stop offset="100%" stopColor="#7546ed" stopOpacity=".015" /></linearGradient></defs><g className="bp-trend-grid"><path d="M34 42 H562 M34 86 H562 M34 130 H562 M34 170 H562" /><text x="4" y="45">40</text><text x="4" y="89">30</text><text x="4" y="133">20</text></g><path className="bp-trend-area" d={trendArea} /><path className="bp-trend-line" d={trendLine} /><circle cx={trendCoords.at(-1)?.x ?? 562} cy={trendCoords.at(-1)?.y ?? 146} r="5" /><g className="bp-trend-labels"><text x="34" y="186">Start</text><text x="266" y="186">Mid-range</text><text x="520" y="186">Current</text></g></svg></section>
          </div>
        </div>
        <section className="bp-card bp-recent-card"><div className="bp-card-head"><h3>Recent Opportunities</h3><button className="bp-link" onClick={() => onOpen("Opportunities")}>View All <RiArrowRightSLine /></button></div><ReportOpportunityTable rows={recent} /></section>
      </> : tab === "Opportunities" ? <section className="bp-card bp-report-table-card"><div className="bp-card-head"><h3>Opportunities</h3><span>{rows.length} in selected period</span></div><ReportOpportunityTable rows={recent.length ? [...recent, ...rows.filter(row => !recent.some(item => item.id === row.id))].slice(0, 12) : []} /></section>
        : tab === "Meetings" ? <section className="bp-card bp-report-table-card"><div className="bp-card-head"><h3>Meeting Activity</h3><span>{upcoming} upcoming · {completed} completed</span></div><div className="bp-report-meetings">{meetings.slice().sort((a, b) => a.date.localeCompare(b.date)).slice(0, 12).map(item => <div key={item.id}><span className="bp-datebadge"><span>{monthDay(item.date).month}</span><b>{monthDay(item.date).day}</b></span><div><strong>{item.title}</strong><small>{item.time} · {item.kind}</small></div><span className={`bp-status-pill ${item.status === "Completed" ? "is-approved" : "is-pending"}`}><i />{item.status}</span></div>)}</div></section>
          : tab === "Deals" ? <section className="bp-card bp-report-table-card"><div className="bp-card-head"><h3>Deals</h3><span>{dealRows.length} active deal records</span></div><ReportOpportunityTable rows={dealRows.slice(0, 12)} showDeal /></section>
            : <section className="bp-card bp-report-table-card"><div className="bp-card-head"><h3>Invoice Summary</h3><span>{bills.length} invoices for this brand</span></div><div className="bp-money bp-report-money"><div><span>Total Invoiced</span><strong>{inr(summary.total)}</strong></div><div className="is-paid"><span>Paid</span><strong>{inr(summary.paid)}</strong></div><div className="is-due"><span>Pending</span><strong>{inr(summary.pending)}</strong></div></div><table className="bp-table"><thead><tr>{["Invoice No.", "Opportunity Ref", "Invoice Date", "Amount", "Status"].map(item => <th key={item}>{item}</th>)}</tr></thead><tbody>{bills.map(item => <tr key={item.id}><td className="is-ref">{item.id}</td><td>{item.opportunityId}</td><td>{shortDate(item.date)}</td><td>{inr(item.amount)}</td><td>{item.status}</td></tr>)}</tbody></table></section>}
    </div>
  );
}

function ReportOpportunityTable({ rows, showDeal = false }: { rows: Opportunity[]; showDeal?: boolean }) {
  return <div className="bp-table-card"><table className="bp-table bp-report-opportunity-table"><thead><tr>{["Opportunity Ref", "Customer", "Franchise Model", "Stage", ...(showDeal ? ["Deal Value"] : []), "Last Activity"].map(item => <th key={item}>{item}</th>)}</tr></thead><tbody>{rows.map(item => <tr key={item.id}><td className="is-ref">{item.id}</td><td>{item.customer}</td><td>{item.model}</td><td><Chip variant="caption" color={stageColor[item.stage]}>{item.stage}</Chip></td>{showDeal && <td>{item.dealValue != null ? inr(item.dealValue) : "—"}</td>}<td>{item.activity} · {shortDate(item.created)}</td></tr>)}{!rows.length && <tr><td colSpan={showDeal ? 6 : 5} className="bp-empty">No opportunities for this report.</td></tr>}</tbody></table></div>;
}

type NoticeCategory = "Meetings" | "Opportunities" | "Deals" | "Invoices" | "System";

function noticeCategory(notice: Notice): NoticeCategory {
  const title = `${notice.title} ${notice.detail}`.toLowerCase();
  if (title.includes("meeting") || title.includes("follow-up")) return "Meetings";
  if (title.includes("opportunit")) return "Opportunities";
  if (title.includes("deal") || title.includes("won")) return "Deals";
  if (title.includes("invoice") || title.includes("document") || title.includes("mom")) return "Invoices";
  return "System";
}

function noticeDateGroup(when: string) {
  const match = when.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/);
  if (!match) return "Earlier";
  const date = new Date(`${match[2]} ${match[1]}, ${match[3]}`);
  const today = new Date(`${reviewDate}T00:00:00`);
  const dayDiff = Math.round((today.getTime() - new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()) / 86_400_000);
  return dayDiff === 0 ? "Today" : dayDiff === 1 ? "Yesterday" : "Earlier";
}

function noticeTimestamp(when: string) {
  const match = when.match(/^(\d{1,2}\s+[A-Za-z]{3}\s+\d{4}),\s+(.+)$/);
  return match ? new Date(`${match[1]} ${match[2]}`).getTime() : 0;
}

function notificationIcon(category: NoticeCategory) {
  if (category === "Meetings") return RiCalendarLine;
  if (category === "Opportunities") return RiStackLine;
  if (category === "Deals") return RiTrophyLine;
  if (category === "Invoices") return RiFileTextLine;
  return RiNotification3Line;
}

function NotificationsPanel({ notices, meetings, opportunities: rows, onRead, onSetRead, onReadMany, onDeleteMany, onOpenTarget }: { notices: Notice[]; meetings: Meeting[]; opportunities: Opportunity[]; onRead: (id: string) => void; onSetRead: (id: string, unread: boolean) => void; onReadMany: (ids: string[]) => void; onDeleteMany: (ids: string[]) => void; onOpenTarget: (notice: Notice) => void }) {
  const filters = ["All", "Unread", "Meetings", "Opportunities", "Deals", "Invoices", "Archived", "Favorites"] as const;
  const [filter, setFilter] = useState<(typeof filters)[number]>("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [archivedIds, setArchivedIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const unreadCount = notices.filter(item => item.unread).length;
  const visible = notices.filter(item => {
    const archived = archivedIds.includes(item.id);
    if (filter === "Archived") return archived;
    if (archived) return false;
    return filter === "All" || (filter === "Unread" ? item.unread : filter === "Favorites" ? favoriteIds.includes(item.id) : noticeCategory(item) === filter);
  }).sort((a, b) => noticeTimestamp(b.when) - noticeTimestamp(a.when));
  const selected = visible.find(item => item.id === selectedId) ?? visible[0] ?? null;
  const groups = ["Today", "Yesterday", "Earlier"] as const;
  const visibleIds = visible.map(item => item.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.includes(id));
  const someSelected = visibleIds.some(id => selectedIds.includes(id));
  const toggleFavorite = (id: string) => setFavoriteIds(current => current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
  useEffect(() => { const ids = new Set(notices.map(item => item.id)); setFavoriteIds(current => current.filter(id => ids.has(id))); setSelectedIds(current => current.filter(id => ids.has(id))); }, [notices]);
  return <div className="bp-notification-layout">
    <section className="bp-notification-list-panel">
      <div className="bp-notification-list-head">
        <Checkbox size="sm" aria-label="Select all notifications" isSelected={allSelected} isIndeterminate={someSelected && !allSelected} isDisabled={!visible.length} onChange={() => setSelectedIds(allSelected ? [] : visibleIds)} />
        <div className="bp-notification-list-tools">
          <BoardSelect aria-label="Filter notifications" selectedKey={filter} onSelectionChange={key => { setFilter(String(key) as (typeof filters)[number]); setSelectedId(null); setSelectedIds([]); }} className="bp-notification-filter-select">
            {filters.map(item => <SelectItem key={item} id={item}>{item}{item === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}</SelectItem>)}
          </BoardSelect>
          {someSelected && <div className="bp-notification-bulk-actions"><button type="button" aria-label={`Delete ${selectedIds.length} selected notifications`} title="Delete selected" onClick={() => { onDeleteMany(selectedIds); setSelectedIds([]); }}><RiDeleteBinLine /></button><button type="button" aria-label={`Mark ${selectedIds.length} selected notifications as read`} title="Mark selected as read" onClick={() => onReadMany(selectedIds)}><RiCheckLine /></button></div>}
        </div>
      </div>
      <div className="bp-notification-list">{groups.map(group => {
        const groupItems = visible.filter(item => noticeDateGroup(item.when) === group);
        if (!groupItems.length) return null;
        return <section className="bp-notification-group" key={group}><h3>{group}</h3>{groupItems.map(item => {
          const category = noticeCategory(item); const Icon = notificationIcon(category); const favorite = favoriteIds.includes(item.id);
          return <div className="bp-notification-row" key={item.id} data-selected={item.id === selected?.id} data-unread={item.unread}>
            <Checkbox size="sm" aria-label={`Select ${item.title}`} isSelected={selectedIds.includes(item.id)} onChange={() => setSelectedIds(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])} />
            <span className={`bp-notification-icon is-${category.toLowerCase()}`}><Icon /></span>
            <button type="button" className="bp-notification-row-main" onClick={() => { setSelectedId(item.id); if (item.unread) onRead(item.id); }}><span className="bp-notification-copy"><strong>{item.title}</strong><small>{item.detail}</small></span></button>
            <span className="bp-notification-time">{item.when.split(", ").slice(1).join(", ")}</span>
            <button type="button" className={`bp-notification-star${favorite ? " is-favorite" : ""}`} aria-label={favorite ? "Remove from favorites" : "Add to favorites"} title={favorite ? "Remove favorite" : "Add favorite"} onClick={() => toggleFavorite(item.id)}>{favorite ? <RiStarFill /> : <RiStarLine />}</button>
          </div>;
        })}</section>;
      })}{!visible.length && <p className="bp-empty">No notifications in this view.</p>}</div>
    </section>
    {selected && (() => {
      const category = noticeCategory(selected); const Icon = notificationIcon(category);
      const meeting = selected.targetType === "meeting" ? meetings.find(item => item.id === selected.targetId) : undefined;
      const opportunity = selected.targetType === "opportunity" ? rows.find(item => item.id === selected.targetId) : undefined;
      const relatedLabel = selected.targetType === "meeting" ? "meeting" : selected.targetType === "opportunity" ? (category === "Deals" ? "deal" : "opportunity") : selected.targetType === "invoice" ? "invoice" : selected.targetType === "document" ? "document" : "record";
      return <aside className="bp-notification-detail" key={selected.id}>
        <div className="bp-notice-detail-actions"><span className={`bp-notification-icon is-${category.toLowerCase()}`}><Icon /></span><div className="bp-notice-detail-toolbar">
          <button type="button" aria-label={archivedIds.includes(selected.id) ? "Restore notification" : "Archive notification"} title={archivedIds.includes(selected.id) ? "Restore" : "Archive"} onClick={() => { setArchivedIds(current => current.includes(selected.id) ? current.filter(id => id !== selected.id) : [...current, selected.id]); setSelectedId(null); }}><RiArchiveLine /></button>
          <button type="button" aria-label="Delete notification" title="Delete" className="is-delete" onClick={() => { onDeleteMany([selected.id]); setSelectedId(null); }}><RiDeleteBinLine /></button>
          <button type="button" className="bp-notice-mark-read" aria-label={selected.unread ? "Mark as read" : "Mark as unread"} title={selected.unread ? "Mark as read" : "Mark as unread"} onClick={() => onSetRead(selected.id, !selected.unread)}>{selected.unread ? <RiMailLine /> : <RiMailUnreadLine />}</button>
        </div></div>
        <span className="bp-notice-category">{category}</span><h3>{selected.title}</h3><p className="bp-notice-when">{selected.when}</p><p className="bp-notice-description">{selected.detail}</p>
        <div className="bp-notice-context"><span><RiNotification3Line />{category} update</span>
          {meeting && <><span><RiTimeLine />{meeting.date} · {meeting.time}</span>{meeting.kind === "Virtual" && meeting.meetLink && <a href={meeting.meetLink} target="_blank" rel="noreferrer"><img src="https://upload.wikimedia.org/wikipedia/commons/e/e4/Google_Meet_icon_%282026%29.svg" alt="" />Join with Google Meet<RiExternalLinkLine /></a>}{meeting.kind !== "Virtual" && meeting.place && <span><RiMapPin2Line />{meeting.place}</span>}{meeting.participants.length > 0 && <span><RiGroupLine />{meeting.participants.map(person => person.name).join(", ")}</span>}</>}
          {opportunity && <><span><RiMapPin2Line />{opportunity.city}</span><span><RiStackLine />{opportunity.model} · {opportunity.stage}</span></>}
          {selected.targetId && <button type="button" onClick={() => onOpenTarget(selected)}>Open {relatedLabel} · {selected.targetId}<RiArrowRightSLine /></button>}
        </div>
      </aside>;
    })()}
  </div>;
}

const permissionOptions = [
  { id: "Opportunities", description: "View brand opportunities and details", icon: RiStackLine },
  { id: "Meetings", description: "View meetings, agenda and MOM", icon: RiCalendarLine },
  { id: "Deals", description: "View brand deals and status", icon: RiTrophyLine },
  { id: "Invoices & Documents", description: "View and download invoices and documents", icon: RiFileTextLine },
  { id: "Reports", description: "View brand reports and insights", icon: RiTimeLine },
  { id: "Users", description: "Manage brand users and access", icon: RiGroupLine },
] as const;

function UsersView({ brandName, people, audits, admin, currentId, onDeactivate, onUpdate }: { brandName: string; people: { id: string; name: string; email: string; role: PortalRole; status: string; lastLogin: string }[]; audits: { id: string; user: string; action: string; related: string; when: string }[]; admin: boolean; currentId: string; onDeactivate: (person: { id: string; name: string; role: string }) => void; onUpdate: (person: { id: string; name: string; email: string; role: PortalRole }) => void }) {
  const admins = people.filter(item => item.role === "Brand Admin" && item.status === "Active").length;
  const [permissions, setPermissions] = useState<Record<string, string[]>>(() => Object.fromEntries(people.map(person => [person.id, person.role === "Brand Admin" ? permissionOptions.map(item => item.id) : person.id === "BU-2" ? ["Opportunities", "Meetings", "Deals"] : ["Opportunities", "Invoices & Documents"]])));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [permissionDraft, setPermissionDraft] = useState<string[]>([]);
  const [menuUserId, setMenuUserId] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"permissions" | "view" | "edit" | null>(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [detailDraft, setDetailDraft] = useState<{ name: string; email: string; role: PortalRole }>({ name: "", email: "", role: "Brand Representative" });
  const selectedUser = people.find(item => item.id === selectedId) ?? null;
  const showSidePanel = !!selectedUser || activityOpen;
  const activeCount = people.filter(item => item.status === "Active").length;
  function openPermissions(person: (typeof people)[number]) {
    setPermissionDraft(permissions[person.id] ?? []);
    setSelectedId(person.id);
    setPanelMode("permissions");
    setActivityOpen(false);
    setMenuUserId(null);
  }
  function openUserPanel(person: (typeof people)[number], mode: "view" | "edit") {
    setSelectedId(person.id);
    setPanelMode(mode);
    setActivityOpen(false);
    setDetailDraft({ name: person.name, email: person.email, role: person.role });
    setMenuUserId(null);
  }
  return (
    <div className="bp-users-page">
      <header className="bp-hello"><div><h2>Users</h2><p>People who can sign in to {brandName}. A person belongs to this brand only.</p></div>{admin && <button className={`bp-users-activity-toggle${activityOpen ? " is-active" : ""}`} onClick={() => { setSelectedId(null); setPanelMode(null); setActivityOpen(value => !value); }} aria-expanded={activityOpen}><RiTimeLine />Activity</button>}</header>
      <div className={`bp-users-layout${showSidePanel ? " has-permissions" : ""}`}>
        <div className="bp-users-main">
          <div className="bp-user-stats">
            <div><span>Total users</span><strong>{people.length}</strong></div>
            <div><span>Active users</span><strong>{activeCount}</strong></div>
            <div><span>Inactive users</span><strong>{people.length - activeCount}</strong></div>
          </div>
          <div className="bp-table-card bp-users-table-wrap">
            <table className="bp-table bp-users-table">
              <thead><tr>{["User", "Role", "Permissions", "Status", "Last login", ...(admin ? ["Actions"] : [])].map(item => <th key={item}>{item}</th>)}</tr></thead>
              <tbody>
                {people.map(person => {
                  const grants = permissions[person.id] ?? [];
                  return <tr key={person.id}>
                    <td><span className="bp-row-person"><i>{initials(person.name)}</i><span><strong>{person.name}</strong><small>{person.email}</small></span></span></td>
                    <td><span className={`bp-user-role${person.role === "Brand Admin" ? " is-admin" : ""}`}>{person.role}</span></td>
                    <td><span className="bp-user-permission-summary">{person.role === "Brand Admin" ? "All access" : grants.length ? grants.join(", ") : "No access"}</span></td>
                    <td><Chip variant="caption" color={person.status === "Active" ? "lime" : "gray"}>{person.status}</Chip></td>
                    <td>{person.lastLogin}</td>
                    {admin && <td><div className="bp-user-actions">
                      <Dropdown isOpen={menuUserId === person.id} onOpenChange={isOpen => setMenuUserId(isOpen ? person.id : null)}>
                        <DropdownTrigger className="bp-user-more" aria-label={`Actions for ${person.name}`} aria-expanded={menuUserId === person.id}>···</DropdownTrigger>
                        <DropdownPopover aria-label={`Actions for ${person.name}`} placement="bottom end" className="w-[190px]" dialogClassName="gap-1">
                          <DropdownItem onSelect={() => openUserPanel(person, "view")}><RiEyeLine />View details</DropdownItem>
                          <DropdownItem onSelect={() => openUserPanel(person, "edit")}><RiFileTextLine />Edit details</DropdownItem>
                          <DropdownItem onSelect={() => openPermissions(person)}><RiStackLine />Manage permissions</DropdownItem>
                          {person.status === "Active" && person.id !== currentId && !(person.role === "Brand Admin" && admins < 2) && <DropdownItem onSelect={() => { onDeactivate(person); setMenuUserId(null); }} className="bp-user-menu-danger">Deactivate</DropdownItem>}
                        </DropdownPopover>
                      </Dropdown>
                    </div></td>}
                  </tr>;
                })}
              </tbody>
            </table>
          </div>
        </div>
        {selectedUser && panelMode && <aside className="bp-permission-panel" aria-label={`${panelMode === "permissions" ? "Manage permissions for" : panelMode === "edit" ? "Edit details for" : "Details for"} ${selectedUser.name}`}>
          <div className="bp-permission-panel-head"><div><h3>{panelMode === "permissions" ? "Manage permissions" : panelMode === "edit" ? "Edit user details" : "User details"}</h3><p>{panelMode === "permissions" ? "Update what this user can access in the brand portal." : panelMode === "edit" ? "Update this person's brand account details." : "Account and access details for this brand user."}</p></div><button aria-label="Close user panel" onClick={() => { setSelectedId(null); setPanelMode(null); }}><RiCloseLine /></button></div>
          <div className="bp-permission-user"><i>{initials(panelMode === "edit" ? detailDraft.name || selectedUser.name : selectedUser.name)}</i><span><strong>{panelMode === "edit" ? detailDraft.name || selectedUser.name : selectedUser.name}</strong><small>{panelMode === "edit" ? detailDraft.role : selectedUser.role}</small></span></div>
          {panelMode === "permissions" ? <>
            <div className="bp-permission-list">
              {permissionOptions.map(item => {
                const Icon = item.icon;
                const checked = permissionDraft.includes(item.id);
                return <label className="bp-permission-row" key={item.id}>
                  <Icon />
                  <span><strong>{item.id}</strong><small>{item.description}</small></span>
                  <input type="checkbox" checked={checked} onChange={() => setPermissionDraft(current => checked ? current.filter(value => value !== item.id) : [...current, item.id])} aria-label={`${item.id} permission`} />
                </label>;
              })}
            </div>
            <div className="bp-permission-actions"><button className="bp-event-close" onClick={() => { setSelectedId(null); setPanelMode(null); }}>Cancel</button><button className="bp-event-edit" onClick={() => { setPermissions(current => ({ ...current, [selectedUser.id]: permissionDraft })); setSelectedId(null); setPanelMode(null); }}>Save changes</button></div>
          </> : panelMode === "edit" ? <>
            <div className="bp-user-detail-form">
              <label>Name<input value={detailDraft.name} onChange={event => setDetailDraft(current => ({ ...current, name: event.target.value }))} /></label>
              <label>Email<input type="email" value={detailDraft.email} onChange={event => setDetailDraft(current => ({ ...current, email: event.target.value }))} /></label>
              <label>Role<BoardSelect aria-label="User role" selectedKey={detailDraft.role} onSelectionChange={key => setDetailDraft(current => ({ ...current, role: String(key) as PortalRole }))} className="bp-user-role-select" triggerClassName="bp-filter-trigger" popoverClassName="bp-menu-fit"><SelectItem id="Brand Admin">Brand Admin</SelectItem><SelectItem id="Brand Representative">Brand Representative</SelectItem></BoardSelect></label>
            </div>
            <div className="bp-permission-actions"><button className="bp-event-close" onClick={() => { setSelectedId(null); setPanelMode(null); }}>Cancel</button><button className="bp-event-edit" disabled={!detailDraft.name.trim() || !detailDraft.email.trim()} onClick={() => { onUpdate({ id: selectedUser.id, ...detailDraft }); setSelectedId(null); setPanelMode(null); }}>Save changes</button></div>
          </> : <div className="bp-user-detail-list"><div><span>Email</span><strong>{selectedUser.email}</strong></div><div><span>Role</span><strong>{selectedUser.role}</strong></div><div><span>Status</span><strong>{selectedUser.status}</strong></div><div><span>Last login</span><strong>{selectedUser.lastLogin}</strong></div></div>}
        </aside>}
        {activityOpen && <aside className="bp-permission-panel bp-user-activity-panel" aria-label="Brand user activity">
          <div className="bp-permission-panel-head"><div><h3>Recent activity</h3><p>Latest actions across {brandName}.</p></div><button aria-label="Close activity" onClick={() => setActivityOpen(false)}><RiCloseLine /></button></div>
          <div className="bp-user-activity-table-wrap"><table className="bp-user-activity-table"><thead><tr><th>Name</th><th>Activity</th><th>Date</th><th>Time</th></tr></thead><tbody>{audits.slice(0, 12).map(item => { const [date, time] = item.when.split(","); return <tr key={item.id}><td>{item.user}</td><td><strong>{item.action}</strong><small>{item.related}</small></td><td>{date?.trim() || item.when}</td><td>{time?.trim() || "—"}</td></tr>; })}{!audits.length && <tr><td className="bp-user-activity-empty" colSpan={4}>No activity yet.</td></tr>}</tbody></table></div>
        </aside>}
      </div>
    </div>
  );
}

function downloadInvoice(invoice: Invoice) {
  const body = `iFranchise CRM\nInvoice ${invoice.id}\nOpportunity ${invoice.opportunityId}\nDate ${shortDate(invoice.date)}\nAmount ${inr(invoice.amount)}\nStatus ${invoice.status}\nThis file is limited to the signed-in brand.\n`;
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${invoice.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadBrandDocument(file: BrandDocument) {
  const body = `iFranchise CRM\nDocument ${file.id}\n${file.name}\nOpportunity ${file.opportunityId}\nParty ${file.party}\nStatus ${file.status}\n`;
  const url = URL.createObjectURL(new Blob([body], { type: "text/plain" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${file.id}.txt`;
  link.click();
  URL.revokeObjectURL(url);
}
