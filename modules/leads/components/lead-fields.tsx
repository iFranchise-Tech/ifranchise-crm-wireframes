"use client";

import { useRef, useState } from "react";
import { CalendarDate } from "@internationalized/date";
import { Popover as AriaPopover } from "react-aria-components";
import { DateCalendar } from "@/components/base/date-picker/date-calendar";
import { formatTriggerDate } from "@/components/base/date-picker/shared";
import { Dropdown, DropdownPopover, DropdownTrigger } from "@/components/base/dropdown/dropdown";
import { Input } from "@/components/base/input/input";
import { Select, SelectItem, type SelectProps } from "@/components/base/select/select";
import { cx } from "@/utils/cx";

const dialCodes = [
  { id: "IN", dial: "+91", digits: 10 },
  { id: "US", dial: "+1", digits: 10 },
  { id: "GB", dial: "+44", digits: 10 },
  { id: "AE", dial: "+971", digits: 9 },
  { id: "AU", dial: "+61", digits: 9 },
  { id: "SG", dial: "+65", digits: 8 },
];

const pinCities: Record<string, [string, string]> = {
  "110": ["New Delhi", "Delhi"],
  "122": ["Gurugram", "Haryana"],
  "134": ["Panchkula", "Haryana"],
  "141": ["Ludhiana", "Punjab"],
  "143": ["Amritsar", "Punjab"],
  "160": ["Chandigarh", "Chandigarh"],
  "171": ["Shimla", "Himachal Pradesh"],
  "180": ["Srinagar", "Jammu and Kashmir"],
  "201": ["Noida", "Uttar Pradesh"],
  "208": ["Kanpur", "Uttar Pradesh"],
  "211": ["Prayagraj", "Uttar Pradesh"],
  "226": ["Lucknow", "Uttar Pradesh"],
  "248": ["Dehradun", "Uttarakhand"],
  "282": ["Agra", "Uttar Pradesh"],
  "302": ["Jaipur", "Rajasthan"],
  "313": ["Udaipur", "Rajasthan"],
  "342": ["Jodhpur", "Rajasthan"],
  "360": ["Rajkot", "Gujarat"],
  "380": ["Ahmedabad", "Gujarat"],
  "390": ["Vadodara", "Gujarat"],
  "395": ["Surat", "Gujarat"],
  "400": ["Mumbai", "Maharashtra"],
  "403": ["Panaji", "Goa"],
  "411": ["Pune", "Maharashtra"],
  "440": ["Nagpur", "Maharashtra"],
  "452": ["Indore", "Madhya Pradesh"],
  "462": ["Bhopal", "Madhya Pradesh"],
  "492": ["Raipur", "Chhattisgarh"],
  "500": ["Hyderabad", "Telangana"],
  "520": ["Vijayawada", "Andhra Pradesh"],
  "522": ["Guntur", "Andhra Pradesh"],
  "530": ["Visakhapatnam", "Andhra Pradesh"],
  "560": ["Bengaluru", "Karnataka"],
  "570": ["Mysuru", "Karnataka"],
  "575": ["Mangaluru", "Karnataka"],
  "580": ["Hubballi", "Karnataka"],
  "600": ["Chennai", "Tamil Nadu"],
  "641": ["Coimbatore", "Tamil Nadu"],
  "682": ["Kochi", "Kerala"],
  "695": ["Thiruvananthapuram", "Kerala"],
  "700": ["Kolkata", "West Bengal"],
  "751": ["Bhubaneswar", "Odisha"],
  "781": ["Guwahati", "Assam"],
  "800": ["Patna", "Bihar"],
  "834": ["Ranchi", "Jharkhand"],
};

const pinStates: Record<string, string> = {
  "11": "Delhi", "12": "Haryana", "13": "Haryana", "14": "Punjab", "15": "Punjab", "16": "Chandigarh",
  "17": "Himachal Pradesh", "18": "Jammu and Kashmir", "19": "Jammu and Kashmir", "20": "Uttar Pradesh",
  "21": "Uttar Pradesh", "22": "Uttar Pradesh", "23": "Uttar Pradesh", "24": "Uttarakhand", "25": "Uttar Pradesh",
  "26": "Uttar Pradesh", "27": "Uttar Pradesh", "28": "Uttar Pradesh", "30": "Rajasthan", "31": "Rajasthan",
  "32": "Rajasthan", "33": "Rajasthan", "34": "Rajasthan", "36": "Gujarat", "37": "Gujarat", "38": "Gujarat",
  "39": "Gujarat", "40": "Maharashtra", "41": "Maharashtra", "42": "Maharashtra", "43": "Maharashtra",
  "44": "Maharashtra", "45": "Madhya Pradesh", "46": "Madhya Pradesh", "47": "Madhya Pradesh", "48": "Madhya Pradesh",
  "49": "Chhattisgarh", "50": "Telangana", "51": "Andhra Pradesh", "52": "Andhra Pradesh", "53": "Andhra Pradesh",
  "56": "Karnataka", "57": "Karnataka", "58": "Karnataka", "59": "Karnataka", "60": "Tamil Nadu",
  "61": "Tamil Nadu", "62": "Tamil Nadu", "63": "Tamil Nadu", "64": "Tamil Nadu", "67": "Kerala",
  "68": "Kerala", "69": "Kerala", "70": "West Bengal", "71": "West Bengal", "72": "West Bengal",
  "73": "West Bengal", "74": "West Bengal", "75": "Odisha", "76": "Odisha", "77": "Odisha",
  "78": "Assam", "79": "Assam", "80": "Bihar", "81": "Bihar", "82": "Jharkhand", "83": "Jharkhand",
  "84": "Bihar", "85": "Bihar",
};

export function placeForPin(pin: string) {
  const city = pinCities[pin.slice(0, 3)];
  if (city) return { city: city[0], state: city[1] };
  const state = pinStates[pin.slice(0, 2)];
  return state ? { city: "", state } : null;
}

export const placeOptions: { city: string; state: string }[] = [
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Ahmedabad", state: "Gujarat" },
  { city: "Bengaluru", state: "Karnataka" },
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Bhubaneswar", state: "Odisha" },
  { city: "Chandigarh", state: "Chandigarh" },
  { city: "Chennai", state: "Tamil Nadu" },
  { city: "Coimbatore", state: "Tamil Nadu" },
  { city: "Delhi", state: "Delhi" },
  { city: "Gurugram", state: "Haryana" },
  { city: "Guwahati", state: "Assam" },
  { city: "Hyderabad", state: "Telangana" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Kochi", state: "Kerala" },
  { city: "Kolkata", state: "West Bengal" },
  { city: "Lucknow", state: "Uttar Pradesh" },
  { city: "Ludhiana", state: "Punjab" },
  { city: "Mangaluru", state: "Karnataka" },
  { city: "Mumbai", state: "Maharashtra" },
  { city: "Mysuru", state: "Karnataka" },
  { city: "Nagpur", state: "Maharashtra" },
  { city: "Noida", state: "Uttar Pradesh" },
  { city: "Patna", state: "Bihar" },
  { city: "Pune", state: "Maharashtra" },
  { city: "Raipur", state: "Chhattisgarh" },
  { city: "Ranchi", state: "Jharkhand" },
  { city: "Surat", state: "Gujarat" },
  { city: "Thiruvananthapuram", state: "Kerala" },
  { city: "Vadodara", state: "Gujarat" },
  { city: "Vijayawada", state: "Andhra Pradesh" },
  { city: "Visakhapatnam", state: "Andhra Pradesh" },
];

export const stateOptions = [...new Set(placeOptions.map(place => place.state))].sort();
export const cityOptions = placeOptions.map(place => place.city);

export function stateForCity(city: string) {
  return placeOptions.find(place => place.city.toLowerCase() === city.trim().toLowerCase())?.state;
}

export function LeadSelect<T extends object>({ popoverClassName, ...props }: SelectProps<T>) {
  return <Select {...props} popoverClassName={cx("ld-menu-fit", popoverClassName)} />;
}

export function SuggestField({ label, name, value, onChange, options, compact }: { label: string; name?: string; value: string; onChange: (value: string) => void; options: string[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const query = value.trim().toLowerCase();
  const matches = query.length >= 1
    ? options.filter(option => option.toLowerCase().startsWith(query) && option.toLowerCase() !== query).slice(0, 6)
    : [];
  return (
    <div className={compact ? "ld-suggest-wrap" : "relative flex min-w-0 flex-col gap-1"}>
      {!compact && <span className="text-body-medium text-text-primary">{label}<span className="text-text-error-primary"> *</span></span>}
      <input
        ref={inputRef}
        className={compact ? "ld-inline" : "ld-suggest-input"}
        name={name}
        aria-label={label}
        required={!compact}
        autoComplete="off"
        value={value}
        placeholder={compact ? undefined : "Type to search"}
        onChange={event => { onChange(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 140)}
      />
      <AriaPopover
        triggerRef={inputRef}
        isOpen={open && matches.length > 0}
        isNonModal
        placement="bottom start"
        offset={4}
        className="ld-suggest-pop"
        style={{ width: inputRef.current?.offsetWidth }}
      >
        <ul>
          {matches.map(option => (
            <li key={option}>
              <button type="button" onMouseDown={event => event.preventDefault()} onClick={() => { onChange(option); setOpen(false); }}>{option}</button>
            </li>
          ))}
        </ul>
      </AriaPopover>
    </div>
  );
}

export function formatLeadDate(date: CalendarDate) {
  return formatTriggerDate(date, "en-GB");
}

export const leadTimes = Array.from({ length: 25 }, (_, index) => {
  const hour = 8 + Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  const labelHour = hour % 12 || 12;
  return `${labelHour}:${minute} ${hour < 12 ? "AM" : "PM"}`;
});

export function PhoneField() {
  const [code, setCode] = useState("IN");
  const [digits, setDigits] = useState("");
  const country = dialCodes.find(item => item.id === code) ?? dialCodes[0];
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-body-medium text-text-primary">Mobile number<span className="text-text-error-primary"> *</span></span>
      <div className="flex items-start gap-2">
        <LeadSelect aria-label="Country code" selectedKey={code} onSelectionChange={key => { setCode(String(key)); setDigits(current => current.slice(0, (dialCodes.find(item => item.id === key)?.digits ?? 10))); }} className="w-[92px] shrink-0">
          {dialCodes.map(item => <SelectItem key={item.id} id={item.id}>{item.dial}</SelectItem>)}
        </LeadSelect>
        <Input
          className="min-w-0 flex-1"
          aria-label="Mobile number"
          inputMode="numeric"
          isRequired
          value={digits}
          placeholder={`${country.digits} digits`}
          onChange={value => setDigits(value.replace(/\D/g, "").slice(0, country.digits))}
        />
      </div>
      <input type="hidden" name="mobile" value={digits ? `${country.dial} ${digits}` : ""} />
    </div>
  );
}

export function DateField({ label, name, defaultValue }: { label?: string; name: string; defaultValue: Date }) {
  const [value, setValue] = useState(() => new CalendarDate(defaultValue.getFullYear(), defaultValue.getMonth() + 1, defaultValue.getDate()));
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {label && <span className="text-body-medium text-text-primary">{label}</span>}
      <Dropdown isOpen={open} onOpenChange={setOpen}>
        <DropdownTrigger className="ld-date-trigger" aria-label={label || "Choose a date"}>{formatLeadDate(value)}</DropdownTrigger>
        <DropdownPopover aria-label={label || "Calendar"} placement="bottom start" className="ld-calendar-pop" dialogClassName="gap-0">
          <DateCalendar
            aria-label={label || "Date"}
            value={value}
            onChange={date => { setValue(date); setOpen(false); }}
          />
        </DropdownPopover>
      </Dropdown>
      <input type="hidden" name={name} value={formatTriggerDate(value, "en-GB")} />
    </div>
  );
}
