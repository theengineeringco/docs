# Electric bike reference project

The shared example for product pages, used sparingly (see the skill's "Examples"
section). It follows **Example: Electric Bike**, the template project every Flow
workspace starts with, so readers recognize it in their own workspace. Names and
values below are taken from that template. Where a page needs something the
template does not have (a test result value, a proposal), it is marked
*illustrative*; keep illustrative values consistent with the template.
If a page needs a new record, add it here first, then use it.

The template's real owners are Flow employees. Never name them; use the roles below.

## The product

A Class 3 pedal-assist electric bicycle: it senses pedaling effort and adds motor
assistance up to a regulated 28 mph, for commuting, errands, and light cargo.
Assist modes: Eco, Tour, Sport, and Turbo.

## Systems (product breakdown structure)

```
Electric Bike
├── Electric Drive System        mid-drive motor, motor controller, torque & cadence
│                                sensor, speed sensor
├── Energy Storage System
│   ├── Battery Pack
│   └── Battery Management System (BMS)
├── Rider Interface & Controls   display unit, mode switch, walk-assist
├── Lighting
└── Mechanical Systems           frame & structure, drivetrain, wheels & tires,
                                 steering & suspension, braking system, cargo & accessories
```

Outside the product boundary (**External Systems**): the Rider, the AC Charger, and
Service & Diagnostic Tools.

Owners, by role:

| System | Owner |
| --- | --- |
| Electric Bike | Product lead engineer |
| Electric Drive System | Drive systems engineer |
| Energy Storage System | Battery systems engineer |
| Battery Management System | BMS firmware engineer (owns the firmware) |
| Rider Interface & Controls | HMI engineer |
| Lighting | Electrical engineer |
| Mechanical Systems | Mechanical engineer |

## Requirements

Decomposition, the opening thread:

```
Range in Eco, Ideal Conditions   ≥ 60 miles            Electric Bike
├── Battery Usable Capacity      ≥ 720 Wh              Battery Pack
└── Drive Efficiency, Eco Mode   ≥ 85%                 Electric Drive System
```

Statement form, from the template: "The battery pack shall provide at least 720 Wh
of usable energy (between low-cutoff SOC and full SOC) at 20 °C ambient."

Other requirements used across pages:

| Requirement | Value | System |
| --- | --- | --- |
| Class 3 Speed Compliance | Assist cuts off at or below 28 mph | Electric Bike |
| Top Assisted Speed | Assist up to 28 mph | Electric Drive System |
| Continuous Motor Power | ≥ 250 W at the rear wheel | Electric Drive System |
| Hill-Climb Capability | ≥ 10 mph on a 6% grade, GVW, Turbo | Electric Bike |
| Stopping Distance, Dry | ≤ 25 ft from 28 mph at GVW | Mechanical Systems |
| Maximum Cargo Load | 200 lb cargo and passenger | Mechanical Systems |
| Battery Cycle Life | ≥ 80% capacity after 800 cycles | Battery Pack |
| Battery Thermal Limits | Charge and discharge temperature window | Battery Management System |
| Electric Bike Mass | Within the total mass budget | Electric Bike |

Compliance requirements group under **CPSC 1512 Compliance** (brakes, frame
strength, reflectors, labeling) and **UL 2849 Battery System Compliance**.

## Interfaces

- **Charger DC Power**: 42 VDC from the AC Charger into the charge port.
- **Charger Handshake**: charger-to-BMS authorization.
- **Rider Pedal Torque Input**: crank torque from the rider, per ISO 4210.
- **Diagnostic Service Port**: firmware update, fault codes, calibration.

## Verification

Tests are grouped under test plans: Drive Performance, Braking Performance, Mass
Verification, Battery Safety & Durability, Environmental, and Regulatory Compliance.
A test records its **Measured Value**, **Results Status**, and **Test Date**.

| Test | Test plan | Verifies |
| --- | --- | --- |
| Hill-Climb at 6% Grade, GVW, Turbo | Drive Performance | Hill-Climb Capability |
| Top Assisted Speed Verification | Drive Performance | Top Assisted Speed |
| Class 3 Speed Cutoff Verification | Drive Performance | Class 3 Speed Compliance |

*Illustrative* results for the hill-climb test: Prototype Build 1 at 8.6 mph, Build 2
at 9.4 mph (both short of 10 mph), Build 3 at 10.3 mph (passes). Each result is its
own record; averaging them does not describe the bike.

## Branches

Variant (a lasting difference):

```
Base          shared design, standards, and common requirements
└── EU Config the EU-market configuration (EU pedal-assist rules: assist to
              25 km/h, 250 W rated power)
```

Proposals, from Base unless a page is about variants:

- **Battery capacity trade study** (*illustrative*): Battery Usable Capacity
  720 → 840 Wh. Touches range, the battery and bike mass budgets, and charge time.
- **BMS improvements** (*illustrative*): revised thermal management in the BMS.
- From the template: **Supplier Review - Battery Spec**, **Supplier Review — AC
  Charger ICD**, and **RCA - BMS Thermal De-rate Response**.

## The firmware review (agents and integrations)

The BMS firmware engineer opens a pull request in GitHub that changes the battery's
charging temperature limits in firmware. Flow's review on the pull request:

- finds the affected requirement, Battery Thermal Limits, and flags the mismatch;
- suggests the traceability links the change is missing;
- names the people who resolve it: the BMS firmware engineer, who owns the code, and
  the battery systems engineer, who owns the requirement.

Describe the outcome, not internal trigger names.

## Saved views

The template saves **Systems**, **Requirements**, **Testing**, **Full Traceability**,
**Risks**, and **Documents**. They show the same records for different tasks.
