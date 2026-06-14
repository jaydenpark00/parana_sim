tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "on-primary-fixed":"#002201","on-error-container":"#ffdad6","on-tertiary":"#561b35",
        "background":"#01161e","primary-fixed-dim":"#a1d494","on-primary":"#0a3909",
        "on-surface-variant":"#c2c9bb","on-surface":"#cfe6f2","error":"#ffb4ab",
        "secondary-fixed-dim":"#e7bdb1","surface":"#01161e","surface-dim":"#01161e",
        "surface-variant":"#233841","tertiary-container":"#7c3a55","secondary-container":"#5d4037",
        "surface-container-high":"#172d36","surface-tint":"#a1d494","on-primary-container":"#9dd090",
        "primary-container":"#2d5a27","surface-bright":"#273c45","outline-variant":"#42493e",
        "surface-container-highest":"#233841","inverse-primary":"#3b6934","error-container":"#93000a",
        "tertiary-fixed":"#ffd9e4","secondary-fixed":"#ffdbd0","on-background":"#cfe6f2",
        "outline":"#8c9387","on-secondary-container":"#d4aca0","surface-container-lowest":"#001018",
        "on-tertiary-container":"#ffaac8","on-primary-fixed-variant":"#23501e","primary":"#a1d494",
        "inverse-on-surface":"#1e333c","tertiary":"#ffb0cc","on-secondary":"#442a22",
        "secondary":"#e7bdb1","on-error":"#690005","surface-container-low":"#071e27",
        "inverse-surface":"#cfe6f2","primary-fixed":"#bcf0ae","surface-container":"#0c222b",
        "tertiary-fixed-dim":"#ffb0cc"
      },
      borderRadius: { "DEFAULT":"0.125rem","lg":"0.25rem","xl":"0.5rem","full":"0.75rem" },
      spacing: { "base":"8px","sidebar_width":"260px","card_padding":"20px","gutter":"16px","container_margin":"24px" },
      fontFamily: { "label-md":["Inter"],"headline-sm":["Inter"],"body-md":["Inter"],"data-mono":["Inter"] },
      fontSize: {
        "label-md":["12px",{"lineHeight":"16px","letterSpacing":"0.05em","fontWeight":"600"}],
        "headline-lg":["32px",{"lineHeight":"40px","fontWeight":"600"}],
        "data-mono":["14px",{"lineHeight":"20px","fontWeight":"500"}],
        "headline-sm":["20px",{"lineHeight":"28px","fontWeight":"600"}],
        "body-sm":["14px",{"lineHeight":"20px","fontWeight":"400"}],
        "body-md":["16px",{"lineHeight":"24px","fontWeight":"400"}],
        "headline-md":["24px",{"lineHeight":"32px","fontWeight":"600"}]
      }
    }
  }
}
