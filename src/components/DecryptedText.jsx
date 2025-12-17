import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

export default function DecryptedText({
    text,
    speed = 10,
    maxIterations = 10,
    sequential = false,
    revealDirection = 'start',
    useOriginalCharsOnly = false,
    characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!@#$%^&*()_+',
    className = '',
    parentClassName = '',
    encryptedClassName = '',
    animateOn = 'hover',
    ...props
}) {
    const [displayText, setDisplayText] = useState(text);
    const [isHovering, setIsHovering] = useState(false);
    const [isScrambling, setIsScrambling] = useState(false);
    const [revealedIndices, setRevealedIndices] = useState(new Set());
    const [hasAnimated, setHasAnimated] = useState(false);
    const elementRef = useRef(null);
    const observerRef = useRef(null);

    const getRandomChar = (originalChar) => {
        if (useOriginalCharsOnly && text.includes(originalChar)) {
            const availableChars = text.split('').filter((c) => c !== ' ');
            return availableChars[Math.floor(Math.random() * availableChars.length)];
        }
        return characters[Math.floor(Math.random() * characters.length)];
    };

    const scramble = () => {
        if (isScrambling) return;
        setIsScrambling(true);
        setRevealedIndices(new Set());

        let iterations = 0;
        const interval = setInterval(() => {
            setDisplayText((prev) =>
                prev
                    .split('')
                    .map((char, index) => {
                        if (char === ' ') return ' ';

                        const shouldReveal = sequential
                            ? revealDirection === 'start'
                                ? index < iterations
                                : revealDirection === 'end'
                                    ? index >= text.length - iterations
                                    : Math.abs(index - Math.floor(text.length / 2)) <
                                    iterations / 2
                            : iterations > maxIterations / 2;

                        if (shouldReveal) {
                            setRevealedIndices((prev) => new Set([...prev, index]));
                            return text[index];
                        }

                        return getRandomChar(char);
                    })
                    .join('')
            );

            iterations++;

            if (iterations > maxIterations) {
                clearInterval(interval);
                setDisplayText(text);
                setIsScrambling(false);
                setRevealedIndices(new Set([...Array(text.length).keys()]));
            }
        }, speed);
    };

    useEffect(() => {
        if (animateOn === 'view' && !hasAnimated) {
            observerRef.current = new IntersectionObserver(
                (entries) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            scramble();
                            setHasAnimated(true);
                            observerRef.current?.disconnect();
                        }
                    });
                },
                { threshold: 0.1 }
            );

            if (elementRef.current) {
                observerRef.current.observe(elementRef.current);
            }

            return () => observerRef.current?.disconnect();
        }
    }, [animateOn, hasAnimated]);

    useEffect(() => {
        if (animateOn === 'hover' && isHovering) {
            scramble();
        }
    }, [isHovering, animateOn]);

    useEffect(() => {
        if (animateOn === 'load' && !hasAnimated) {
            scramble();
            setHasAnimated(true);
        }
    }, [animateOn]);

    return (
        <motion.span
            ref={elementRef}
            className={parentClassName}
            onMouseEnter={() => animateOn === 'hover' && setIsHovering(true)}
            onMouseLeave={() => animateOn === 'hover' && setIsHovering(false)}
            {...props}
        >
            {displayText.split('').map((char, index) => (
                <motion.span
                    key={index}
                    className={
                        revealedIndices.has(index) ? className : encryptedClassName
                    }
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.1, delay: index * 0.02 }}
                >
                    {char}
                </motion.span>
            ))}
        </motion.span>
    );
}
