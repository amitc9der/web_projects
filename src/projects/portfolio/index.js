/**
 * Loads the portfolio section into the given container element and returns the generated HTML element.
 */
export default async function loadPortfolio() {
    const main = document.getElementById("main");
    main.innerHTML = "";
    
    // Apply main container styles - Paper retro theme
    Object.assign(main.style, {
        width: "100%",
        height: "100%",
        display: "block",
        overflowY: "auto",
        overflowX: "hidden",
        background: "#f5f1e8",
        backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)
        `,
        fontFamily: "'Courier New', 'Times New Roman', serif",
        color: "#3d2817",
        scrollBehavior: "smooth",
        position: "relative",
    });

    // Load configuration
    let config;
    try {
        // Use relative path that works in both dev and production
        const configPath = new URL("./portfolio-config.json", import.meta.url).href;
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`Failed to load config: ${response.statusText}`);
        }
        config = await response.json();
    } catch (error) {
        console.error("Failed to load portfolio config:", error);
        // Fallback to empty config if loading fails
        config = {
            hero: { title: "", description: "", ctaButtons: [] },
            about: { title: "", text: "", interests: [] },
            skills: { title: "", items: [] },
            projects: { title: "", items: [] },
            contact: { title: "", subtitle: "", links: [] }
        };
    }

    // Create portfolio container
    const portfolioContainer = createElement("div", {
        style: {
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "2rem",
        }
    });

    // Hero Section
    const heroSection = createHeroSection(config.hero);
    portfolioContainer.appendChild(heroSection);

    // About Section
    const aboutSection = createAboutSection(config.about);
    portfolioContainer.appendChild(aboutSection);

    // Skills Section
    const skillsSection = createSkillsSection(config.skills);
    portfolioContainer.appendChild(skillsSection);

    // Projects Section
    const projectsSection = createProjectsSection(config.projects);
    portfolioContainer.appendChild(projectsSection);

    // Contact Section
    const contactSection = createContactSection(config.contact);
    portfolioContainer.appendChild(contactSection);

    main.appendChild(portfolioContainer);

    // Add scroll animations
    addScrollAnimations();
}

function createHeroSection(heroConfig) {
    const section = createElement("section", {
        style: {
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            padding: "4rem 2rem",
            position: "relative",
        }
    });

    const title = createElement("h2", {
        style: {
            fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
            fontWeight: "400",
            margin: "0 0 2rem 0",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            animation: "fadeInUp 1s ease-out 0.2s both",
            borderBottom: "3px double #8b6f47",
            paddingBottom: "1rem",
            display: "inline-block",
        },
        textContent: heroConfig.title || ""
    });

    const description = createElement("p", {
        style: {
            fontSize: "clamp(1rem, 2vw, 1.25rem)",
            maxWidth: "700px",
            lineHeight: "2",
            margin: "0 0 3rem 0",
            color: "#4a3423",
            fontStyle: "italic",
            animation: "fadeInUp 1s ease-out 0.4s both",
        },
        textContent: heroConfig.description || ""
    });

    const ctaButtons = createElement("div", {
        style: {
            display: "flex",
            gap: "1.5rem",
            flexWrap: "wrap",
            justifyContent: "center",
            animation: "fadeInUp 1s ease-out 0.6s both",
        }
    });

    (heroConfig.ctaButtons || []).forEach((buttonConfig, index) => {
        const buttonStyle = index === 0 ? {
            background: "#e8ddd4",
            color: "#3d2817",
            border: "2px solid #8b6f47",
        } : {
            background: "#8b6f47",
            color: "#f5f1e8",
            border: "2px solid #8b6f47",
        };

        const onClick = buttonConfig.action === "scroll" && buttonConfig.target
            ? () => {
                document.getElementById(buttonConfig.target)?.scrollIntoView({ behavior: "smooth" });
            }
            : null;

        const btn = createButton(buttonConfig.text, {
            ...buttonStyle,
            onClick
        });
        ctaButtons.appendChild(btn);
    });

    section.appendChild(title);
    section.appendChild(description);
    section.appendChild(ctaButtons);

    return section;
}

function createAboutSection(aboutConfig) {
    const section = createElement("section", {
        id: "about-section",
        style: {
            padding: "4rem 2rem",
            background: "#faf8f3",
            margin: "2rem 0",
            border: "2px solid #d4c4a8",
            boxShadow: "8px 8px 0px rgba(139, 111, 71, 0.2), inset 0 0 0 1px rgba(139, 111, 71, 0.1)",
            position: "relative",
        }
    });

    // Paper corner decoration
    const corner1 = createElement("div", {
        style: {
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "30px",
            height: "30px",
            borderTop: "2px solid #8b6f47",
            borderRight: "2px solid #8b6f47",
        }
    });
    const corner2 = createElement("div", {
        style: {
            position: "absolute",
            bottom: "10px",
            left: "10px",
            width: "30px",
            height: "30px",
            borderBottom: "2px solid #8b6f47",
            borderLeft: "2px solid #8b6f47",
        }
    });
    section.appendChild(corner1);
    section.appendChild(corner2);

    const title = createElement("h2", {
        style: {
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: "600",
            margin: "0 0 2rem 0",
            textAlign: "center",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #8b6f47",
            paddingBottom: "0.5rem",
            display: "inline-block",
            width: "100%",
        },
        textContent: aboutConfig.title || "About Me"
    });

    const content = createElement("div", {
        style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            maxWidth: "1000px",
            margin: "0 auto",
        }
    });

    const aboutText = createElement("p", {
        style: {
            fontSize: "1.1rem",
            lineHeight: "1.8",
            color: "#4a3423",
            textAlign: "justify",
        },
        textContent: aboutConfig.text || ""
    });

    const interests = createElement("div", {
        style: {
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
        }
    });

    const interestsTitle = createElement("h3", {
        style: {
            fontSize: "1.5rem",
            margin: "0 0 1rem 0",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
        },
        textContent: "Interests"
    });

    (aboutConfig.interests || []).forEach(interest => {
        const item = createElement("div", {
            style: {
                padding: "0.75rem 1rem",
                background: "#e8ddd4",
                border: "1px solid #d4c4a8",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                boxShadow: "2px 2px 0px rgba(139, 111, 71, 0.1)",
            }
        });

        const bullet = createElement("span", {
            style: {
                width: "8px",
                height: "8px",
                background: "#8b6f47",
                borderRadius: "50%",
            }
        });

        const text = createElement("span", {
            textContent: interest,
            style: {
                color: "#3d2817",
            }
        });

        item.appendChild(bullet);
        item.appendChild(text);
        interests.appendChild(item);
    });

    interests.insertBefore(interestsTitle, interests.firstChild);
    content.appendChild(aboutText);
    content.appendChild(interests);
    section.appendChild(title);
    section.appendChild(content);

    return section;
}

function createSkillsSection(skillsConfig) {
    const section = createElement("section", {
        id: "skills-section",
        style: {
            padding: "4rem 2rem",
            margin: "2rem 0",
        }
    });

    const title = createElement("h2", {
        style: {
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: "600",
            margin: "0 0 3rem 0",
            textAlign: "center",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #8b6f47",
            paddingBottom: "0.5rem",
            display: "inline-block",
            width: "100%",
        },
        textContent: skillsConfig.title || "Skills & Technologies"
    });

    const skillsGrid = createElement("div", {
        style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "1.5rem",
            maxWidth: "1000px",
            margin: "0px auto",
        }
    });

    (skillsConfig.items || []).forEach(skillName => {
        const skillCard = createElement("div", {
            style: {
                background: "#faf8f3",
                padding: "1.5rem",
                border: "2px solid #d4c4a8",
                boxShadow: "4px 4px 0px rgba(139, 111, 71, 0.2)",
                textAlign: "center",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                color: "#3d2817",
                fontFamily: "'Courier New', monospace",
                fontWeight: "600",
                fontSize: "1rem",
            },
            textContent: skillName
        });

        skillCard.onmouseenter = () => {
            Object.assign(skillCard.style, {
                transform: "translate(-2px, -2px)",
                boxShadow: "6px 6px 0px rgba(139, 111, 71, 0.3)",
            });
        };

        skillCard.onmouseleave = () => {
            Object.assign(skillCard.style, {
                transform: "translate(0, 0)",
                boxShadow: "4px 4px 0px rgba(139, 111, 71, 0.2)",
            });
        };

        skillsGrid.appendChild(skillCard);
    });

    section.appendChild(title);
    section.appendChild(skillsGrid);

    return section;
}

function createProjectsSection(projectsConfig) {
    const section = createElement("section", {
        id: "projects-section",
        style: {
            padding: "4rem 2rem",
            background: "#faf8f3",
            margin: "2rem 0",
            border: "2px solid #d4c4a8",
            boxShadow: "8px 8px 0px rgba(139, 111, 71, 0.2), inset 0 0 0 1px rgba(139, 111, 71, 0.1)",
            position: "relative",
        }
    });

    // Paper corner decoration
    const corner1 = createElement("div", {
        style: {
            position: "absolute",
            top: "10px",
            right: "10px",
            width: "30px",
            height: "30px",
            borderTop: "2px solid #8b6f47",
            borderRight: "2px solid #8b6f47",
        }
    });
    const corner2 = createElement("div", {
        style: {
            position: "absolute",
            bottom: "10px",
            left: "10px",
            width: "30px",
            height: "30px",
            borderBottom: "2px solid #8b6f47",
            borderLeft: "2px solid #8b6f47",
        }
    });
    section.appendChild(corner1);
    section.appendChild(corner2);

    const title = createElement("h2", {
        style: {
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: "600",
            margin: "0 0 3rem 0",
            textAlign: "center",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #8b6f47",
            paddingBottom: "0.5rem",
            display: "inline-block",
            width: "100%",
        },
        textContent: projectsConfig.title || "Featured Projects"
    });

    const projectsGrid = createElement("div", {
        style: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "2rem",
            maxWidth: "1200px",
            margin: "0 auto",
        }
    });

    (projectsConfig.items || []).forEach(project => {
        const projectCard = createElement("div", {
            style: {
                background: "#e8ddd4",
                padding: "2rem",
                border: "2px solid #d4c4a8",
                boxShadow: "4px 4px 0px rgba(139, 111, 71, 0.2)",
                transition: "transform 0.2s ease, box-shadow 0.2s ease",
                display: "flex",
                flexDirection: "column",
            }
        });

        projectCard.onmouseenter = () => {
            Object.assign(projectCard.style, {
                transform: "translate(-3px, -3px)",
                boxShadow: "6px 6px 0px rgba(139, 111, 71, 0.3)",
            });
        };

        projectCard.onmouseleave = () => {
            Object.assign(projectCard.style, {
                transform: "translate(0, 0)",
                boxShadow: "4px 4px 0px rgba(139, 111, 71, 0.2)",
            });
        };

        const projectTitle = createElement("h3", {
            style: {
                fontSize: "1.5rem",
                margin: "0 0 1rem 0",
                fontWeight: "600",
                color: "#5c3d2e",
                fontFamily: "'Courier New', monospace",
                textTransform: "uppercase",
            },
            textContent: project.title
        });

        const projectDesc = createElement("p", {
            style: {
                fontSize: "1rem",
                lineHeight: "1.6",
                color: "#4a3423",
                margin: "0 0 1.5rem 0",
                flexGrow: "1",
                textAlign: "justify",
            },
            textContent: project.description
        });

        const techTags = createElement("div", {
            style: {
                display: "flex",
                flexWrap: "wrap",
                gap: "0.5rem",
                margin: "0 0 1.5rem 0",
            }
        });

        (project.technologies || []).forEach(tech => {
            const tag = createElement("span", {
                style: {
                    padding: "0.25rem 0.75rem",
                    background: "#faf8f3",
                    border: "1px solid #8b6f47",
                    fontSize: "0.85rem",
                    color: "#3d2817",
                    fontFamily: "'Courier New', monospace",
                },
                textContent: tech
            });
            techTags.appendChild(tag);
        });

        const viewBtn = createButton("View Project", {
            background: "#8b6f47",
            color: "#f5f1e8",
            border: "2px solid #8b6f47",
            onClick: () => {
                if (window.AppContext?.router && project.routes && project.routes.length > 0) {
                    window.AppContext.router.navigate(project.routes[0]);
                }
            }
        });

        projectCard.appendChild(projectTitle);
        projectCard.appendChild(projectDesc);
        projectCard.appendChild(techTags);
        projectCard.appendChild(viewBtn);

        projectsGrid.appendChild(projectCard);
    });

    section.appendChild(title);
    section.appendChild(projectsGrid);

    return section;
}

function createContactSection(contactConfig) {
    const section = createElement("section", {
        id: "contact-section",
        style: {
            padding: "4rem 2rem",
            margin: "2rem 0",
            textAlign: "center",
        }
    });

    const title = createElement("h2", {
        style: {
            fontSize: "clamp(2rem, 4vw, 3rem)",
            fontWeight: "600",
            margin: "0 0 1rem 0",
            color: "#5c3d2e",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            borderBottom: "2px solid #8b6f47",
            paddingBottom: "0.5rem",
            display: "inline-block",
        },
        textContent: contactConfig.title || "Get In Touch"
    });

    const subtitle = createElement("p", {
        style: {
            fontSize: "1.2rem",
            color: "#4a3423",
            margin: "0 0 3rem 0",
            maxWidth: "600px",
            marginLeft: "auto",
            marginRight: "auto",
            fontStyle: "italic",
        },
        textContent: contactConfig.subtitle || ""
    });

    const contactLinks = createElement("div", {
        style: {
            display: "flex",
            justifyContent: "center",
            gap: "2rem",
            flexWrap: "wrap",
        }
    });

    (contactConfig.links || []).forEach(link => {
        const linkBtn = createButton(link.name, {
            background: "#e8ddd4",
            color: "#3d2817",
            border: "2px solid #8b6f47",
            onClick: () => window.open(link.url, "_blank"),
        });
        contactLinks.appendChild(linkBtn);
    });

    section.appendChild(title);
    section.appendChild(subtitle);
    section.appendChild(contactLinks);

    return section;
}

function createButton(text, options = {}) {
    const {
        background = "#e8ddd4",
        color = "#3d2817",
        border = "2px solid #8b6f47",
        onClick = null,
    } = options;

    const button = createElement("button", {
        style: {
            padding: "1rem 2rem",
            fontSize: "1rem",
            fontWeight: "600",
            background,
            color,
            border,
            cursor: "pointer",
            transition: "all 0.2s ease",
            fontFamily: "'Courier New', monospace",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            boxShadow: "3px 3px 0px rgba(139, 111, 71, 0.3)",
        },
        textContent: text
    });

    button.onmouseenter = () => {
        Object.assign(button.style, {
            transform: "translate(-2px, -2px)",
            boxShadow: "5px 5px 0px rgba(139, 111, 71, 0.4)",
        });
    };

    button.onmouseleave = () => {
        Object.assign(button.style, {
            transform: "translate(0, 0)",
            boxShadow: "3px 3px 0px rgba(139, 111, 71, 0.3)",
        });
    };

    if (onClick) {
        button.onclick = onClick;
    }

    return button;
}

function createElement(tag, options = {}) {
    const { style = {}, textContent = "", id = "", className = "" } = options;
    const element = document.createElement(tag);
    
    Object.assign(element.style, style);
    if (textContent) element.textContent = textContent;
    if (id) element.id = id;
    if (className) element.className = className;
    
    return element;
}

function addScrollAnimations() {
    // Add CSS animations via style tag
    const style = document.createElement("style");
    style.textContent = `
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

    // Intersection Observer for scroll animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = "1";
                entry.target.style.transform = "translateY(0)";
            }
        });
    }, observerOptions);

    // Observe all sections
    const sections = document.querySelectorAll("section");
    sections.forEach(section => {
        Object.assign(section.style, {
            opacity: "0",
            transform: "translateY(30px)",
            transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        });
        observer.observe(section);
    });
}
