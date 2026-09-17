/* global expect */

const MOBILE_BREAKPOINT = 768;
const MOBILE_ART_MAX_SIZE = 720;

const viewports = [
  { width: 320, height: 568, label: "celular estreito" },
  { width: 390, height: 844, label: "celular" },
  { width: 667, height: 375, label: "celular em paisagem" },
  { width: 768, height: 1024, label: "tablet" },
  { width: 1440, height: 900, label: "desktop" },
];

const numberFromCss = (value) => Number.parseFloat(value);

describe("banner responsivo da landing", () => {
  viewports.forEach(({ width, height, label }) => {
    it(`preserva a arte completa em ${label}`, () => {
      cy.viewport(width, height);
      cy.visit("/");

      cy.get(".hero").should("be.visible").then(($hero) => {
        const hero = $hero[0];
        const heroRect = hero.getBoundingClientRect();
        const background = getComputedStyle(hero, "::before");

        if (width <= MOBILE_BREAKPOINT) {
          const expectedArtSize = Math.min(
            width,
            MOBILE_ART_MAX_SIZE,
            height,
          );
          const [backgroundWidth, backgroundHeight] = background.backgroundSize
            .split(" ")
            .map(numberFromCss);

          expect(background.backgroundImage).to.contain("banner-orfeu-mobile-fit");
          expect(backgroundWidth).to.be.closeTo(expectedArtSize, 1);
          expect(backgroundHeight).to.be.closeTo(expectedArtSize, 1);
          expect(numberFromCss(background.top)).to.be.closeTo(0, 1);
          expect(numberFromCss(background.height)).to.be.closeTo(expectedArtSize, 1);
          expect(heroRect.height).to.be.closeTo(expectedArtSize, 1);

          cy.get(".site-header")
            .should("have.class", "site-header--overlay")
            .find(".header-main")
            .then(($header) => {
              const header = $header[0];
              const headerRect = header.getBoundingClientRect();
              const headerStyles = getComputedStyle(header);

              expect(headerRect.top).to.be.closeTo(heroRect.top, 1);
              expect(headerRect.height).to.be.greaterThan(0);
              expect(headerRect.bottom).to.be.lessThan(heroRect.bottom);
              expect(headerStyles.backgroundImage).to.contain("linear-gradient");
              expect(headerStyles.backdropFilter).to.contain("blur");
            });
        } else {
          expect(background.backgroundImage).to.contain("banner-orfeu-desktop");
          expect(background.backgroundSize).to.equal("cover");
          expect(heroRect.height).to.be.at.least(height);
        }
      });

      cy.document().then((document) => {
        expect(document.documentElement.scrollWidth).to.be.at.most(
          document.documentElement.clientWidth + 1,
        );
      });

      if (width === 390) {
        cy.screenshot("landing-banner-mobile-completo", { capture: "viewport" });
      }
    });
  });
});
