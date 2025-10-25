# Color Vision Testing Research & References

**Purpose:** Open science documentation of color vision deficiency testing methodologies and result visualization best practices.

**Date Compiled:** 2025-10-24

---

## Clinical Testing Standards

### 1. Ishihara Test (Pseudoisochromatic Plates)

**Overview:**

- Most common screening test for red-green color deficiencies
- Uses 38 plates (or 24-plate shortened version) with numbers hidden in colored dots
- Developed by Dr. Shinobu Ishihara in 1917

**Test Administration:**

- 3 seconds per plate maximum
- Requires "daylight" illumination (6000-7000K color temperature)
- No coaching, touching, or tracing allowed

**Plate Types:**

1. **Demonstration plates** - Seen by all (normal and deficient)
2. **Vanishing plates** - Only visible to normal vision
3. **Transformation plates** - Different numbers seen by deficient vs normal
4. **Hidden digit plates** - Only visible to color deficient
5. **Diagnostic plates** - Differentiates protan vs deutan types

**Results Interpretation:**

- **38-plate version:**
  - Normal: ≥10 plates read correctly
  - Deficient: ≤7 plates read correctly
- **24-plate version:**
  - Normal: ≥13 plates read correctly
  - Deficient: ≤9 plates read correctly

**Classification:**

- Binary pass/fail
- Type identification (protanopia/protanomaly vs deuteranopia/deuteranomaly)
- No severity quantification

**Limitations:**

- Only detects red-green deficiencies
- Cannot diagnose blue-yellow (tritanopia) or complete color blindness
- Binary classification lacks sensitivity for mild cases

**References:**

- [Ishihara Test - Wikipedia](https://en.wikipedia.org/wiki/Ishihara_test)
- [Stanford Instructions PDF](https://web.stanford.edu/group/vista/wikiupload/0/0a/Ishihara.14.Plate.Instructions.pdf)
- [ScienceDirect Study on Sensitivity/Specificity](https://www.sciencedirect.com/science/article/pii/S0020653923009887)

---

### 2. Farnsworth D-15 Test (Dichotomous Color Arrangement)

**Overview:**

- Arranges 15 colored caps in hue order to assess moderate-to-severe CVD
- "Dichotomous" design separates subjects into two groups:
  1. Strongly/Medium color deficient
  2. Mildly deficient or color normal

**Test Administration:**

- Patient arranges 15 colored discs by perceived similarity
- Starting reference disc is fixed
- Examiner plots arrangement sequence on circular scoring diagram

**Results Visualization:** ✅ **KEY VISUALIZATION METHOD**

**Circular Diagram Interpretation:**

- Lines connect discs in patient's chosen order
- **Normal Vision:** Lines stay on circle perimeter (few adjacent errors)
- **Deficient Vision:** Lines cross through center (zigzag pattern)
- **Severity:** More center crossings = more severe deficiency (typically >10 crossings = strong deficiency)

**Confusion Axes Identification:**

- **Deutan deficiency:** Green-purple confusion axis
- **Protan deficiency:** Red-cyan (blue-green) confusion axis
- **Tritan deficiency:** Yellow-blue confusion axis
- Direction of zigzag indicates deficiency type

**Pass Criteria (Research Findings):**

- 46% pass with circular diagram (no errors except single adjacent swap)
- 53% pass allowing one red-green isochromatic error
- 60% pass allowing two red-green isochromatic errors
- **Recommended:** Circular diagram criterion (most sensitive)

**Advantages:**

- Visual representation of confusion patterns
- Type and severity assessment
- Quick administration (~5 minutes)

**References:**

- [Colblindor Online D-15 Test](https://www.color-blindness.com/2009/03/10/online-farnsworth-d-15-dichotomous-color-blindness-test/)
- [PubMed: Pass Rates Study](https://pubmed.ncbi.nlm.nih.gov/18426425/)
- [Color Research & Application: Quantitative Scoring](https://onlinelibrary.wiley.com/doi/abs/10.1002/col.22669)

---

### 3. Cambridge Colour Test (CCT)

**Overview:**

- Computerized psychophysical test (research gold standard)
- Measures fine color discrimination thresholds
- Uses Landolt-C targets embedded in colored noise patterns

**Test Components:**

**A. Trivector Test:**

- Measures thresholds along three confusion lines (protan, deutan, tritan)
- Probes sensitivity of L, M, S cones independently
- Uses staircase procedure for threshold detection

**B. Ellipses Test:**

- Measures discrimination along 8-20 vectors in color plane
- Produces MacAdam ellipses in CIE u'v' color space
- Provides full 2D map of discrimination thresholds

**Results Visualization:** ✅ **ADVANCED RESEARCH METHOD**

**Threshold Ellipses:**

- Plotted in CIELUV or CIE(x,y) color space
- **Normal Vision:**
  - Small, circular, symmetrical ellipses
  - Compact dispersion reflecting uniform chromatic sensitivity
  - Within 2.5%-97.5% percentile norms

- **Color Deficient Vision:**
  - Large, elongated ellipses
  - Long axis oriented along confusion axis
  - Ellipse orientation indicates deficiency type
  - Ellipse area quantifies severity

**Clinical Thresholds (Trivector):**

- **Normal cutoffs:**
  - Protan: >10
  - Deutan: >10
  - Tritan: >15
- Below thresholds indicate color vision deficiency

**Parameters Analyzed:**

- Ellipse area (overall sensitivity)
- Rotation angle (type classification)
- Axis ratios (anisotropy of confusion)
- Vector sizes (directional thresholds)

**Advantages:**

- Quantitative severity measurement
- Detailed confusion axis mapping
- Sensitive to mild anomalies
- Research-validated norms

**References:**

- [CRS Cambridge Colour Test](https://www.crsltd.com/tools-for-vision-science/measuring-visual-functions/cambridge-colour-test/)
- [PMC: Discrimination Thresholds Model](https://pmc.ncbi.nlm.nih.gov/articles/PMC5316232/)
- [ResearchGate: CCT Review](https://www.researchgate.net/publication/277904189_Colour_vision_A_review_of_the_Cambridge_Colour_Test_and_other_colour_testing_methods)

---

## Theoretical Foundation: Confusion Lines

### Color Space Mathematics

**Definition:**

- Confusion lines are sets of colors that appear identical to dichromats
- Defined in trichromatic color spaces (LMS, XYZ, etc.)
- All points on a confusion line are metameric to specific CVD types

**Geometric Properties:**

- **Protanopia:** Lines parallel to L-axis (red confusion)
- **Deuteranopia:** Lines parallel to M-axis (green confusion)
- **Tritanopia:** Lines parallel to S-axis (blue confusion)
- Lines converge at "copunctal point" in chromaticity diagram

**CIE Color Space Plotting:**

- Wavelengths 400-700nm map to unique (x,y) coordinates
- Confusion lines plotted as straight lines in CIE xy chromaticity diagram
- Different CVD types have different convergence points

**Confusion Axes (Common Terminology):**

- **Protan:** Red ↔ Cyan (Blue-Green)
- **Deutan:** Green ↔ Purple (Magenta)
- **Tritan:** Yellow ↔ Blue

### Research Applications

**Test Design:**

- Ishihara plates select colors along confusion lines
- Farnsworth D-15 spaces colors to maximize confusion detection
- Cambridge CCT measures thresholds perpendicular to confusion lines

**Simulation Algorithms:**

- Brettel algorithm uses confusion lines for CVD simulation
- sRGB → L*a*b\* color space transformation
- Database of confusable color pairs generated along axes

**References:**

- [Horizon Lab: Understanding Color Blindness](https://horizon-lab.org/colorvis/colorblind.html)
- [Colblindor: Colors of Confusion](https://www.color-blindness.com/2009/01/19/colorblind-colors-of-confusion/)
- [ResearchGate: Construction of Confusion Lines](https://www.researchgate.net/publication/282840266_Construction_of_Confusion_Lines_for_Color_Vision_Deficiency_and_Verification_by_Ishihara_Chart)

---

## Result Presentation Best Practices

### From Clinical Research

**1. Quantitative Scoring (Ishihara)**

- Simple numeric score (e.g., "12/14 correct")
- Classification label ("Normal", "Protan", "Deutan")
- Binary pass/fail threshold

**2. Visual Confusion Mapping (Farnsworth D-15)**

- Circular diagram showing arrangement sequence
- Visual representation of confusion patterns
- Immediate visual understanding of type and severity
- **Insight:** Even "normal" results show the full diagram (circular pattern)

**3. Threshold Ellipses (Cambridge CCT)**

- Quantitative data visualization in color space
- Comparison to normative data (percentiles)
- Shows both location and magnitude of deficiency
- **Insight:** Normal vision gets small ellipses; deficient get elongated ones

### UX Principles for Result Display

**Always Show Data:**

- Display results even when "normal" or "excellent"
- Provide visual context (what normal vs deficient looks like)
- Celebrate success rather than hiding good results

**Provide Interpretation:**

- Explain what results mean diagnostically
- Compare to expected patterns for different CVD types
- Give severity context ("mild", "moderate", "severe")

**Educational Context:**

- Show what CVD would look like for comparison
- Explain confusion axes and why certain colors are problematic
- Provide actionable insights

**Progressive Disclosure:**

- Summary statistics at top
- Detailed visualization below
- Optional deep-dive into individual test results

---

## Application to Adaptive Bayesian Testing

### Our Test Design

**Data Structure:**

- Bayesian belief for each color pair (Beta distribution)
- Confusion probability: P(user confuses colors)
- Uncertainty (entropy): How confident we are
- Number of observations per pair

**Confusion Threshold Considerations:**

**Research Indicates:**

- **Severe deficiency:** >70% confusion on relevant pairs
- **Moderate deficiency:** 40-70% confusion
- **Mild deficiency:** 20-40% confusion
- **Normal vision:** <20% confusion on CVD-prone pairs

### Recommended Visualization Approach

**Based on Research Findings:**

1. **Always Show All Tested Pairs**
   - Don't hide data with arbitrary thresholds
   - Sort by confusion probability (highest first)
   - Show relative difficulty even for "easy" pairs

2. **Confusion Axis Plot** (Farnsworth-inspired)
   - 2D hue wheel or color space plot
   - Draw links between confused color pairs
   - Link thickness ∝ confusion probability
   - Compare to expected confusion axes for user's CVD type

3. **Threshold Summary** (CCT-inspired)
   - Show average confusion per axis (red-cyan, green-purple, yellow-blue)
   - Compare to normative thresholds
   - Quantify severity if deficiency detected

4. **Interpretation Panel**
   - "Your color discrimination is [excellent/good/moderate/poor]"
   - "This suggests [normal vision / mild deuteranomaly / etc.]"
   - "Typical [CVD type] would show [expected pattern]"

5. **Individual Pair Details**
   - List with color swatches
   - Confusion probability bars
   - Number of tests and uncertainty

### Implementation Priority

**Phase 1 (Current):** ✅

- List of confused pairs with swatches
- Basic statistics
- Threshold filtering (adjustable)

**Phase 2 (Next):**

- 2D confusion axis visualization
- Comparison to normative patterns
- Educational overlays

**Phase 3 (Future):**

- Interactive color space plot
- Threshold ellipses
- Export detailed reports

---

## Open Science Commitment

This documentation is maintained for:

- Transparent research methodology
- Reproducible testing protocols
- Community contribution
- Educational purposes

**Contributions Welcome:**

- Additional test methodologies
- Updated research references
- Improved visualization techniques
- Clinical validation data

**License:** Open for research and educational use

**Last Updated:** 2025-10-24

---

## Citations & Further Reading

### Foundational Papers

- Ishihara, S. (1917). Tests for colour-blindness.
- Farnsworth, D. (1943). The Farnsworth-Munsell 100-Hue Test for the examination of color discrimination.
- Regan, B. C., et al. (1994). "The Cambridge Colour Test"

### Modern Research

- Mollon, J. D. & Regan, B. C. (2000). Cambridge Colour Test: A new paradigm
- Almutairi, M., et al. (2021). "Quantitative scoring methods of D15 tests"
- Evans, A. D. B., et al. (2021). "Color vision assessment: D-15 test signals"

### Algorithm Development

- Brettel, H., Viénot, F., & Mollon, J. D. (1997). "Computerized simulation of color appearance for dichromats"
- Machado, G. M., Oliveira, M. M., & Fernandes, L. A. (2009). "A physiologically-based model for simulation of color vision deficiency"

### Color Space Theory

- CIE (1931). "CIE 1931 color space"
- MacAdam, D. L. (1942). "Visual sensitivities to color differences in daylight"
