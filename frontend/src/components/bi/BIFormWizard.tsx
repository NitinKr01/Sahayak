/** Multi-step Benefit Illustration forms for the 4 supported products.
 * Step sequences, defaults and eligibility rules are ported 1:1 from the
 * Streamlit bi_forms.py (the backend re-validates nothing beyond the quote
 * API's own checks, same as before). */
import { useState } from 'react'
import type { BIProductName } from '../../types'
import {
  DateField,
  FundAllocationEditor,
  NumberField,
  RadioField,
  SelectField,
  StepButtons,
  TextField,
  computeAge,
  yearsAgoIso,
} from './fields'

type FormData = Record<string, unknown>

interface WizardProps {
  product: BIProductName
  busy: boolean
  onSubmit: (formData: FormData) => void
}

const range = (start: number, endExclusive: number) =>
  Array.from({ length: Math.max(0, endExclusive - start) }, (_, i) => start + i)

const GENDER_OPTIONS = ['Male', 'Female', 'Other']
const YES_NO = ['Yes', 'No']

export default function BIFormWizard({ product, busy, onSubmit }: WizardProps) {
  return (
    <div className="mt-1.5 max-w-md rounded-[10px] border border-[rgba(21,48,80,0.1)] bg-white p-[13px] shadow-sm">
      <h4 className="mb-3 flex items-center gap-1.5 text-[12.5px] font-bold text-prussian before:block before:h-[13px] before:w-[3px] before:rounded-sm before:bg-chilli">
        {product}
      </h4>
      {product === 'iGuarantee Vishwas' && <IgvForm busy={busy} onSubmit={onSubmit} />}
      {product === 'Secure N Grow' && <SecureForm busy={busy} onSubmit={onSubmit} />}
      {product === 'iInvest Ultima Plus' && <UltimaPlusForm busy={busy} onSubmit={onSubmit} />}
      {product === 'GIP' && <GipForm busy={busy} onSubmit={onSubmit} />}
      {busy && <p className="mt-3 text-[11.5px] text-subtext">Generating creative for you…</p>}
    </div>
  )
}

function Warning({ text }: { text: string | null }) {
  if (!text) return null
  return (
    <p className="rounded-md border-l-[3px] border-[#F59E0B] bg-[#FEFCE8] px-3 py-2 text-[11.5px] text-[#92400E]">
      ⚠️ {text}
    </p>
  )
}

/** allocation shown = stored value per fund, else the strategy default —
 * same as bi_forms.py `data.get("fund_allocation", {}).get(fund, default)` */
function mergeAllocation(
  defaults: Record<string, number>,
  stored: Record<string, number> | undefined,
): Record<string, number> {
  const merged: Record<string, number> = {}
  for (const [fund, def] of Object.entries(defaults)) {
    merged[fund] = stored?.[fund] ?? def
  }
  return merged
}

const sum = (obj: Record<string, number>) => Object.values(obj).reduce((a, b) => a + b, 0)

// =========================================================================
// iGuarantee Vishwas — 2 steps
// =========================================================================
function IgvForm({ busy, onSubmit }: { busy: boolean; onSubmit: (d: FormData) => void }) {
  const [step, setStep] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)

  const [gender, setGender] = useState('Male')
  const [dob, setDob] = useState(yearsAgoIso(18))
  const [smoker, setSmoker] = useState('No')
  const [premium, setPremium] = useState(60000)

  const age = computeAge(dob)
  const validPpt = [5, 6, 7, 8, 10, 12].filter((t) => age + t <= 65)
  const validTerms = [15, 20].filter((t) => age + t <= 65)

  const [ppt, setPpt] = useState<number | null>(null)
  const [policyTerm, setPolicyTerm] = useState<number | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPhone, setAgentPhone] = useState('')

  if (step === 0) {
    return (
      <div className="space-y-3">
        <SelectField label="Select Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        <DateField label="Enter Date of Birth" min={yearsAgoIso(50)} max={yearsAgoIso(18)} value={dob} onChange={setDob} />
        <RadioField label="Are you a smoker?" options={YES_NO} value={smoker} onChange={setSmoker} />
        <NumberField label="Annual Premium" min={18000} max={250000} value={premium} onChange={setPremium} />
        <Warning text={warning} />
        <StepButtons
          nextLabel="Next ➡"
          onNext={() => {
            if (!(premium >= 18000 && premium <= 250000)) {
              setWarning('Annual Premium must be between ₹18,000 and ₹2,50,000')
              return
            }
            setWarning(null)
            setStep(1)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <SelectField
        label="Premium Paying Term"
        options={validPpt}
        value={ppt ?? validPpt[0]}
        onChange={setPpt}
      />
      <SelectField
        label="Policy Term"
        options={validTerms}
        value={policyTerm ?? validTerms[0]}
        onChange={setPolicyTerm}
      />
      <TextField label="Customer Full Name (Optional)" value={customerName} onChange={setCustomerName} />
      <TextField label="Your Full Name (Optional)" value={agentName} onChange={setAgentName} />
      <TextField label="Your Phone Number (Optional)" value={agentPhone} onChange={setAgentPhone} maxLength={10} />
      <StepButtons
        onBack={() => setStep(0)}
        nextLabel="Submit ✅"
        busy={busy}
        onNext={() =>
          onSubmit({
            gender,
            dob,
            age,
            smoker,
            premium,
            premium_paying_term: ppt ?? validPpt[0],
            policy_term: policyTerm ?? validTerms[0],
            customer_name: customerName,
            agent_name: agentName,
            agent_phone_number: agentPhone,
          })
        }
      />
    </div>
  )
}

// =========================================================================
// Secure N Grow — 4 steps
// =========================================================================
const SECURE_STRATEGIES = [
  'SELF MANAGED (Aggressive)',
  'SELF MANAGED (Balanced)',
  'SELF MANAGED (Conservative)',
  'LIFESTYLE',
]

const SECURE_FUND_DEFAULTS: Record<string, Record<string, number>> = {
  'SELF MANAGED (Aggressive)': { 'MIDCAP FUND': 0, 'FLEXI CAP FUND': 50, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 50, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0 },
  'SELF MANAGED (Balanced)': { 'MIDCAP FUND': 0, 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 50, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 50, 'LIQUID FUND': 0 },
  'SELF MANAGED (Conservative)': { 'MIDCAP FUND': 0, 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 0, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 50, 'DEBT FUND': 50, 'LIQUID FUND': 0 },
  LIFESTYLE: { 'MIDCAP FUND': 0, 'BLUE CHIP EQUITY FUND': 0, 'ACCELERATOR FUND': 100, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0 },
}

function SecureForm({ busy, onSubmit }: { busy: boolean; onSubmit: (d: FormData) => void }) {
  const [step, setStep] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)

  const [gender, setGender] = useState('Male')
  const [dob, setDob] = useState(yearsAgoIso(18))
  const [premium, setPremium] = useState(150000)
  const age = computeAge(dob)

  const [policyTerm, setPolicyTerm] = useState<number | null>(null)
  const [strategy, setStrategy] = useState(SECURE_STRATEGIES[0])
  const [storedAllocation, setStoredAllocation] = useState<Record<string, number> | undefined>()
  const [posSumAssured, setPosSumAssured] = useState(0)
  const [customerName, setCustomerName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPhone, setAgentPhone] = useState('')

  const validTerms = [15].filter((t) => age + t <= 65 && t >= 10)
  const allocation = mergeAllocation(SECURE_FUND_DEFAULTS[strategy], storedAllocation)

  if (step === 0) {
    return (
      <div className="space-y-3">
        <SelectField label="Select Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        <DateField label="Enter Date of Birth" min={yearsAgoIso(50)} max={yearsAgoIso(18)} value={dob} onChange={setDob} />
        <SelectField label="Sum Assured Multiple" options={[10]} value={10} onChange={() => {}} disabled />
        <SelectField label="Payment Frequency" options={['Yearly']} value="Yearly" onChange={() => {}} disabled />
        <NumberField label="Annual Premium" min={150000} max={400000} value={premium} onChange={setPremium} />
        <SelectField label="Premium Paying Term" options={[10]} value={10} onChange={() => {}} disabled />
        <Warning text={warning} />
        <StepButtons
          nextLabel="Next ➡"
          onNext={() => {
            if (!(premium >= 150000 && premium <= 400000)) {
              setWarning('Annual Premium must be between ₹1,50,000 and ₹4,00,000')
              return
            }
            if (validTerms.length === 0) {
              setWarning('No valid policy term available for this age.')
              return
            }
            setWarning(null)
            setStep(1)
          }}
        />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <SelectField label="Policy Term" options={validTerms} value={policyTerm ?? validTerms[0]} onChange={setPolicyTerm} />
        <SelectField label="Portfolio Strategy" options={SECURE_STRATEGIES} value={strategy} onChange={setStrategy} />
        <StepButtons onBack={() => setStep(0)} nextLabel="Next ➡" onNext={() => setStep(2)} />
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <FundAllocationEditor
          allocation={allocation}
          disabled={strategy === 'LIFESTYLE'}
          onChange={(fund, value) => setStoredAllocation({ ...allocation, [fund]: value })}
        />
        <NumberField label="Existing POS Sum Assured" min={0} max={2500000} value={posSumAssured} onChange={setPosSumAssured} />
        <Warning text={warning} />
        <StepButtons
          onBack={() => setStep(1)}
          nextLabel="Next ➡"
          onNext={() => {
            const total = sum(allocation)
            if (total !== 100) {
              setWarning(`Total fund allocation must be 100%. Current total is ${total}%.`)
              return
            }
            setWarning(null)
            setStep(3)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <TextField label="Customer Full Name (Optional)" value={customerName} onChange={setCustomerName} />
      <TextField label="Your Full Name (Optional)" value={agentName} onChange={setAgentName} />
      <TextField label="Your Phone Number (Optional)" value={agentPhone} onChange={setAgentPhone} maxLength={10} />
      <StepButtons
        onBack={() => setStep(2)}
        nextLabel="Submit ✅"
        busy={busy}
        onNext={() =>
          onSubmit({
            gender,
            dob,
            age,
            sum_assured_multiple: 10,
            premium,
            payment_frequency: 'Yearly',
            premium_paying_term: 10,
            policy_term: policyTerm ?? validTerms[0],
            portfolio_strategy: strategy,
            fund_allocation: allocation,
            pos_sum_assured: posSumAssured,
            customer_name: customerName,
            agent_name: agentName,
            agent_phone_number: agentPhone,
          })
        }
      />
    </div>
  )
}

// =========================================================================
// iInvest Ultima Plus — 7 steps with rider branching
// =========================================================================
const ULTIMA_STRATEGIES = [
  'SELF MANAGED (Aggressive)',
  'SELF MANAGED (Balanced)',
  'SELF MANAGED (Conservative)',
  'LIFESTYLE',
]

const ULTIMA_FUND_DEFAULTS: Record<string, Record<string, number>> = {
  'SELF MANAGED (New Multicap Cap Fund)': { 'MIDCAP FUND': 0, 'MULTI CAP FUND': 100, 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 0, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0 },
  'SELF MANAGED (Aggressive)': { 'MIDCAP FUND': 40, 'FLEXI CAP FUND': 40, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 20, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0 },
  'SELF MANAGED (Balanced)': { 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 50, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 50, 'LIQUID FUND': 0 },
  'SELF MANAGED (Conservative)': { 'FLEXI CAP FUND': 0, 'ACCELERATOR FUND': 0, 'BLUE CHIP EQUITY FUND': 0, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 50, 'DEBT FUND': 50, 'LIQUID FUND': 0 },
  LIFESTYLE: { 'BLUE CHIP EQUITY FUND': 100, 'ACCELERATOR FUND': 0, 'STABLE FUND': 0, 'OPPORTUNITY FUND': 0, 'SECURE FUND': 0, 'DEBT FUND': 0, 'LIQUID FUND': 0 },
}

function UltimaPlusForm({ busy, onSubmit }: { busy: boolean; onSubmit: (d: FormData) => void }) {
  const [step, setStep] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)

  const [gender, setGender] = useState('Male')
  const [dob, setDob] = useState(yearsAgoIso(18))
  const [smoker, setSmoker] = useState('No')
  const [premium, setPremium] = useState(75000)
  const age = computeAge(dob)

  const [policyTerm, setPolicyTerm] = useState<number | null>(null)
  const validTerms = [10, 15, 20, 25, 30, 35, 40].filter((t) => age + t <= 75)
  const pt = policyTerm ?? validTerms[0]

  const validPpt = [5, 7, 10, 15, 20, 40].filter((t) => age + t <= 65 && t <= pt)
  const [ppt, setPpt] = useState<number | null>(null)
  const [sumAssuredMultiple, setSumAssuredMultiple] = useState(10)
  const [strategy, setStrategy] = useState(ULTIMA_STRATEGIES[0])

  const [storedAllocation, setStoredAllocation] = useState<Record<string, number> | undefined>()
  const [rider, setRider] = useState('No')
  const [riderType, setRiderType] = useState('Classic Option')
  const [riderAge, setRiderAge] = useState<number | null>(null)
  const [riderSumAssured, setRiderSumAssured] = useState(25000)

  const [customerName, setCustomerName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPhone, setAgentPhone] = useState('')

  const allocation = mergeAllocation(ULTIMA_FUND_DEFAULTS[strategy], storedAllocation)
  const effPpt = ppt ?? validPpt[0]
  const riderAgeOptions = effPpt === pt ? range(5, pt + 1) : range(effPpt + 1, pt + 1)
  const maxRiderSA = riderType === 'Classic Option' ? 3000000 : 1000000

  if (step === 0) {
    return (
      <div className="space-y-3">
        <SelectField label="Select Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        <DateField label="Enter Date of Birth" min={yearsAgoIso(60)} max={yearsAgoIso(18)} value={dob} onChange={setDob} />
        <SelectField label="Payment Frequency" options={['Yearly']} value="Yearly" onChange={() => {}} disabled />
        <RadioField label="Are you a smoker?" options={YES_NO} value={smoker} onChange={setSmoker} />
        <NumberField label="Annual Premium" min={75000} max={10000000} value={premium} onChange={setPremium} />
        <Warning text={warning} />
        <StepButtons
          nextLabel="Next ➡"
          onNext={() => {
            if (!(premium >= 75000 && premium <= 10000000)) {
              setWarning('Annual Premium must be between ₹75,000 and ₹1,00,00,000')
              return
            }
            setWarning(null)
            setStep(1)
          }}
        />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Age : {age}</p>
        <SelectField label="Policy Term" options={validTerms} value={pt} onChange={setPolicyTerm} />
        <StepButtons onBack={() => setStep(0)} nextLabel="Next ➡" onNext={() => setStep(2)} />
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className="space-y-3">
        <SelectField label="Premium Paying Term" options={validPpt} value={effPpt} onChange={setPpt} />
        <SelectField label="Sum Assured Multiple" options={range(10, 21)} value={sumAssuredMultiple} onChange={setSumAssuredMultiple} />
        <SelectField label="Portfolio Strategy" options={ULTIMA_STRATEGIES} value={strategy} onChange={setStrategy} />
        <StepButtons onBack={() => setStep(1)} nextLabel="Next ➡" onNext={() => setStep(3)} />
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className="space-y-3">
        <FundAllocationEditor
          allocation={allocation}
          disabled={strategy === 'LIFESTYLE'}
          onChange={(fund, value) => setStoredAllocation({ ...allocation, [fund]: value })}
        />
        <RadioField label="Add Rider" options={YES_NO} value={rider} onChange={setRider} />
        <Warning text={warning} />
        <StepButtons
          onBack={() => setStep(2)}
          nextLabel="Next ➡"
          onNext={() => {
            const total = sum(allocation)
            if (total !== 100) {
              setWarning(`Total fund allocation must be 100%. Current total is ${total}%.`)
              return
            }
            setWarning(null)
            setStep(rider === 'No' ? 6 : 4)
          }}
        />
      </div>
    )
  }

  if (step === 4) {
    return (
      <div className="space-y-3">
        <RadioField label="Choose Rider Option" options={['Classic Option', 'Premium Option']} value={riderType} onChange={setRiderType} />
        <SelectField label="Rider Coverage Age" options={riderAgeOptions} value={riderAge ?? riderAgeOptions[0]} onChange={setRiderAge} />
        <StepButtons onBack={() => setStep(3)} nextLabel="Next ➡" onNext={() => setStep(5)} />
      </div>
    )
  }

  if (step === 5) {
    return (
      <div className="space-y-3">
        <NumberField label="Rider Sum Assured" min={25000} max={maxRiderSA} value={riderSumAssured} onChange={setRiderSumAssured} />
        <Warning text={warning} />
        <StepButtons
          onBack={() => setStep(4)}
          nextLabel="Next ➡"
          onNext={() => {
            if (!(riderSumAssured >= 25000 && riderSumAssured <= maxRiderSA)) {
              setWarning(`Rider Sum Assured must be between ₹25,000 and ₹${maxRiderSA.toLocaleString('en-IN')}`)
              return
            }
            setWarning(null)
            setStep(6)
          }}
        />
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <TextField label="Customer Full Name (Optional)" value={customerName} onChange={setCustomerName} />
      <TextField label="Your Full Name (Optional)" value={agentName} onChange={setAgentName} />
      <TextField label="Your Phone Number (Optional)" value={agentPhone} onChange={setAgentPhone} maxLength={10} />
      <StepButtons
        onBack={() => setStep(rider === 'No' ? 3 : 5)}
        nextLabel="Submit ✅"
        busy={busy}
        onNext={() => {
          const data: FormData = {
            gender,
            dob,
            age,
            smoker,
            premium,
            payment_frequency: 'Yearly',
            policy_term: pt,
            premium_paying_term: effPpt,
            sum_assured_multiple: sumAssuredMultiple,
            portfolio_strategy: strategy,
            fund_allocation: allocation,
            rider,
            customer_name: customerName,
            agent_name: agentName,
            agent_phone_number: agentPhone,
          }
          if (rider === 'Yes') {
            data.rider_type = riderType
            data.rider_age = riderAge ?? riderAgeOptions[0]
            data.rider_sum_assured = riderSumAssured
          }
          onSubmit(data)
        }}
      />
    </div>
  )
}

// =========================================================================
// GIP — 3 steps, plan-dependent fields
// =========================================================================
function GipForm({ busy, onSubmit }: { busy: boolean; onSubmit: (d: FormData) => void }) {
  const [step, setStep] = useState(0)
  const [warning, setWarning] = useState<string | null>(null)

  const [gender, setGender] = useState('Male')
  const [dob, setDob] = useState(yearsAgoIso(18))
  const [smoker, setSmoker] = useState('No')
  const [plan, setPlan] = useState('Flexi Start')
  const [premium, setPremium] = useState(50000)
  const age = computeAge(dob)
  const flexi = plan === 'Flexi Start'

  const validPpt = [5, 6, 7, 8, 10, 12].filter((t) => age + t <= 65)
  const [ppt, setPpt] = useState<number | null>(null)
  const effPpt = ppt ?? validPpt[0]

  const incomePeriodOptions = age > 50 ? [20, 25, 30] : [10, 15, 20, 25, 30]
  const [incomePeriod, setIncomePeriod] = useState<number | null>(null)
  const [deferPayout, setDeferPayout] = useState('No')

  const [extendedPolicyTerm, setExtendedPolicyTerm] = useState(12)
  const [ropOption, setRopOption] = useState('No')
  const validDeferOptions = range(1, 8).filter((i) => i < effPpt)
  const [defermentPeriod, setDefermentPeriod] = useState<number | null>(null)
  const [accumulation, setAccumulation] = useState('No')
  const [advanceIncome, setAdvanceIncome] = useState('No')
  const [payoutFrequency, setPayoutFrequency] = useState('Yearly')

  const [customerName, setCustomerName] = useState('')
  const [agentName, setAgentName] = useState('')
  const [agentPhone, setAgentPhone] = useState('')

  if (step === 0) {
    return (
      <div className="space-y-3">
        <SelectField label="Select Gender" options={GENDER_OPTIONS} value={gender} onChange={setGender} />
        <DateField label="Enter Date of Birth" min={yearsAgoIso(55)} max={yearsAgoIso(18)} value={dob} onChange={setDob} />
        <RadioField label="Are you a smoker?" options={YES_NO} value={smoker} onChange={setSmoker} />
        <SelectField label="Select Plan Option" options={['Flexi Start', 'Extended Benefit']} value={plan} onChange={setPlan} />
        <NumberField label="Annual Premium" min={50000} max={5000000} value={premium} onChange={setPremium} />
        <Warning text={warning} />
        <StepButtons
          nextLabel="Next ➡"
          onNext={() => {
            if (!(premium >= 50000 && premium <= 5000000)) {
              setWarning('Annual Premium must be between ₹50,000 and ₹50,00,000')
              return
            }
            setWarning(null)
            setStep(1)
          }}
        />
      </div>
    )
  }

  if (step === 1) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-slate-600">Age : {age}</p>
        {flexi && (
          <p className="text-sm font-semibold text-slate-700">
            In Flexi Start, Policy Term is same as Premium Paying Term (PT = PPT)
          </p>
        )}
        <SelectField label="Premium Paying Term" options={validPpt} value={effPpt} onChange={setPpt} />
        {flexi && (
          <>
            <SelectField
              label="Income Period"
              options={incomePeriodOptions}
              value={incomePeriod ?? incomePeriodOptions[0]}
              onChange={setIncomePeriod}
            />
            <RadioField
              label="Opt to defer Secured Income Payout"
              options={YES_NO}
              value={deferPayout}
              onChange={setDeferPayout}
            />
          </>
        )}
        <StepButtons onBack={() => setStep(0)} nextLabel="Next ➡" onNext={() => setStep(2)} />
      </div>
    )
  }

  const policyTerm = flexi ? effPpt : extendedPolicyTerm
  return (
    <div className="space-y-3">
      {flexi ? (
        <>
          <RadioField label="Opt for ROP benefit" options={YES_NO} value={ropOption} onChange={setRopOption} />
          {deferPayout === 'Yes' && (
            <SelectField
              label="Deferment Period"
              options={validDeferOptions}
              value={defermentPeriod ?? validDeferOptions[0]}
              onChange={setDefermentPeriod}
            />
          )}
        </>
      ) : (
        <SelectField
          label="Policy Term"
          options={[12, 15, 20, 25, 30]}
          value={extendedPolicyTerm}
          onChange={setExtendedPolicyTerm}
        />
      )}
      <RadioField
        label="Opt for Secured Income Payouts Accumulation"
        options={YES_NO}
        value={accumulation}
        onChange={setAccumulation}
      />
      <RadioField
        label="Opt for Advance Income Option"
        options={YES_NO}
        value={advanceIncome}
        onChange={setAdvanceIncome}
      />
      <SelectField
        label="Payout Frequency"
        options={['Monthly', 'Quarterly', 'Half Yearly', 'Yearly']}
        value={payoutFrequency}
        onChange={setPayoutFrequency}
      />
      <TextField label="Customer Full Name (Optional)" value={customerName} onChange={setCustomerName} placeholder="Eg. Sumit Chand, etc." />
      <TextField label="Your Full Name (Optional)" value={agentName} onChange={setAgentName} />
      <TextField label="Your Phone Number (Optional)" value={agentPhone} onChange={setAgentPhone} maxLength={10} />
      <StepButtons
        onBack={() => setStep(1)}
        nextLabel="Submit ✅"
        busy={busy}
        onNext={() =>
          onSubmit({
            gender,
            dob,
            age,
            smoker,
            plan,
            premium,
            premium_paying_term: effPpt,
            income_period: flexi ? (incomePeriod ?? incomePeriodOptions[0]) : 0,
            defer_payout: flexi ? deferPayout : 'No',
            policy_term: policyTerm,
            secured_income_accumulation_option: accumulation,
            accumulation_period: accumulation === 'Yes' ? policyTerm : 0,
            advance_income_option: advanceIncome === 'Yes',
            payout_frequency: payoutFrequency,
            deferment_period:
              flexi && deferPayout === 'Yes' ? (defermentPeriod ?? validDeferOptions[0]) : 0,
            rop: flexi ? (ropOption === 'Yes' ? 110 : 0) : 100,
            customer_name: customerName,
            agent_name: agentName,
            agent_phone_number: agentPhone,
          })
        }
      />
    </div>
  )
}
