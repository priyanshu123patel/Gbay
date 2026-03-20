import "../styles/Footer.css"

export default function Footer() {
    return (
        
        <footer className="footer mt-5">
            <div className="footer-grid">

                <div className="footer-col">
                    <h4>About</h4>
                    <ul>
                        <li>About Gbay</li>
                        <li>Values & Purpose</li>
                        <li>Leadership</li>
                        <li>Careers</li>
                        <li>Investors</li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Business</h4>
                    <ul>
                        <li>Technology</li>
                        <li>Cloud Solutions</li>
                        <li>Automation</li>
                        <li>Data & Analytics</li>
                        <li>Security</li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Community</h4>
                    <ul>
                        <li>Education</li>
                        <li>Innovation</li>
                        <li>Open Source</li>
                        <li>Sustainability</li>
                    </ul>
                </div>

                <div className="footer-col">
                    <h4>Resources</h4>
                    <ul>
                        <li>Newsroom</li>
                        <li>Documentation</li>
                        <li>Support</li>
                        <li>Privacy Policy</li>
                        <li>Legal Disclaimer</li>
                    </ul>
                </div>

                <div className="footer-col newsletter">
                    <h4>Stay Connected</h4>
                    <p>Subscribe to receive updates from Gbay.</p>

                    <div className="newsletter-box">
                        <input type="email" placeholder="Enter your email ID" />
                        <button>→</button>
                    </div>

                    <div className="socials">
                        <a href="https://www.youtube.com" className="" target="_blank"><img src="/assets/youtube.png" alt="YouTube" className="social-icon" style={{width: 70, height: 60}} /></a>
                        <a href="https://www.linkedin.com" className="" target="_blank"><img src="/assets/linkedin.png" alt="LinkedIn" className="social-icon" style={{width: 40, height: 25}} /></a>
                        <a href="https://www.x.com" className="" target="_blank"><img src="/assets/x.png" alt="X" className="social-icon" style={{width: 50, height: 60}}/></a>
                        <a href="https://www.email.com" className="" target="_blank"><img src="/assets/email.png" alt="Email" className="social-icon" style={{width: 30, height: 35}}/></a>
                    </div>
                </div>

            </div>

            <div className="footer-bottom">
                &copy; 2026 Gbay. All rights reserved.
            </div>

        </footer>

    )
}