"use client";
import { getAmount } from "@/constants/agreement";
import { Document, Page, Text, View, Image, Font } from "@react-pdf/renderer";
import { styles } from "./styles";

Font.register({
  family: "Poppins",
  fonts: [
    { src: "/fonts/Poppins-Regular.ttf", fontWeight: 400 },
    { src: "/fonts/Poppins-Medium.ttf", fontWeight: 500 },
    { src: "/fonts/Poppins-SemiBold.ttf", fontWeight: 600 },
    { src: "/fonts/Poppins-Bold.ttf", fontWeight: 700 },
  ],
});

function CommonHeader({ date, company, client }) {
  return (
    <View style={styles.headerContainer} fixed>
      <View style={styles.stripTop} />
      <View style={styles.headerRow}>
        <Image src={company.logo} style={styles.logo} />
        <View style={styles.companyInfo}><Text>{company.phone}</Text><Text>{company.website}</Text></View>
      </View>
      <View style={styles.headerBottomRow}>
        <Text><Text style={styles.blackBold}>To </Text><Text style={styles.blueBold}>{client?.name?.toUpperCase()}</Text></Text>
        <Text style={styles.blackBold}>{date}</Text>
      </View>
    </View>
  );
}

function CommonFooter() {
  return (
    <View style={styles.footer} fixed>
      <Image src="/assets/footer-wave.png" style={styles.footerWave} />
    </View>
  );
}

export default function SetupAgreementPDF({ company, client, agreement }) {
  if (!company || !client || !agreement) return null;

  return (
    <Document title="Setup Agreement" author={company.name} creator="Magic Scale">
      <Page size="A4" style={styles.page}>
        <CommonHeader date={agreement.date} company={company} client={client} />
        
        <View style={styles.content}>
          <Text style={styles.sectionHeading}>Zomato & Swiggy Growth Service Package Agreement</Text>
          
          <Text style={styles.paragraph}>
            This Setup Agreement is made and entered into between <Text style={styles.blueBold}>{company.name}</Text>, a Proprietorship hereinafter referred to as <Text style={styles.blackBold}>“Consultant”</Text>, and <Text style={styles.blueBold}>{client.name?.toUpperCase()}</Text>, a Proprietorship hereinafter referred to as <Text style={styles.blackBold}>“Client”</Text>, represented by <Text style={styles.blackBold}>{client.representative}</Text>.
          </Text>

          <Text style={styles.sectionHeading}>1. Scope of Services</Text>
          <Text style={styles.paragraph}>
            The <Text style={styles.blackBold}>Consultant</Text> shall provide a comprehensive <Text style={styles.blueBold}>Zomato & Swiggy Growth Service Package</Text> which includes the following professional services:
          </Text>

          <Text style={[styles.paragraph, styles.blackBold]}>1.1 Onboarding Support:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Assistance with Zomato Onboarding (Fee: ₹1299 paid by Client to Zomato).</Text></View>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Assistance with Swiggy Onboarding (Fee: ₹943 paid by Client to Swiggy).</Text></View>
          </View>

          <Text style={[styles.paragraph, styles.blackBold]}>1.2 Account Setup & Profile Creation:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Complete restaurant profile setup, verification, and listing activation.</Text></View>
          </View>

          <Text style={[styles.paragraph, styles.blackBold]}>1.3 Menu Setup & Optimization:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Full menu creation with optimized pricing, categories, and layout management.</Text></View>
          </View>

          <Text style={[styles.paragraph, styles.blackBold]}>1.4 Product Enhancement:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Food photo management, attractive descriptions, and add-ons/combo creation.</Text></View>
          </View>

          <Text style={[styles.paragraph, styles.blackBold]}>1.5 Platform Training & Guidance:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Comprehensive training on dashboard usage and daily order operations.</Text></View>
          </View>

          <Text style={[styles.paragraph, styles.blackBold]}>1.6 1-Month Handling Support:</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Strategic discount setup, ads campaign management, and rating improvement support.</Text></View>
          </View>

          <Text style={styles.sectionHeading}>2. Fees and Payment Terms</Text>
          <Text style={styles.paragraph}>
            The Client agrees to pay the Consultant a <Text style={styles.blueBold}>total service charge of {getAmount(agreement.fee || 8499)}</Text> for the setup package.
          </Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Platform onboarding fees are paid directly to Zomato/Swiggy by the Client.</Text></View>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Full payment for the service package is due upon signing of this Agreement.</Text></View>
          </View>

          <Text style={styles.sectionHeading}>3. Client Responsibilities</Text>
          <View style={styles.bulletList}>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Provide all necessary documents and access for platform onboarding.</Text></View>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Maintain consistent food quality and service standards.</Text></View>
            <View style={styles.bulletItem} wrap={false}><Text style={styles.bulletDot}>•</Text><Text>Timely payment of platform fees and service charges.</Text></View>
          </View>

          <Text style={styles.sectionHeading}>4. Confidentiality</Text>
          <Text style={styles.paragraph}>
            Both parties agree to keep <Text style={styles.blackBold}>confidential</Text> all <Text style={styles.blueBold}>information, data, and trade secrets</Text> shared during the term of this <Text style={styles.blackBold}>Agreement</Text>.
          </Text>

          <Text style={styles.sectionHeading}>5. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            The <Text style={styles.blackBold}>Consultant</Text> shall not be liable for any <Text style={styles.blueBold}>indirect, incidental, or consequential damages</Text> arising from the services provided. Liability is limited to the <Text style={styles.blueBold}>total amount paid</Text> under this Agreement.
          </Text>

          <Text style={styles.sectionHeading}>6. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All <Text style={styles.blueBold}>strategic recommendations and materials</Text> prepared by the Consultant remain their <Text style={styles.blackBold}>intellectual property</Text> unless otherwise agreed in writing.
          </Text>

          <Text style={styles.sectionHeading}>7. Entire Agreement</Text>
          <Text style={styles.paragraph}>
            This <Text style={styles.blackBold}>Agreement</Text> constitutes the <Text style={styles.blueBold}>entire understanding</Text> between the parties and <Text style={styles.blackBold}>supersedes</Text> all prior discussions or agreements.
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 40, paddingTop: 20 }} wrap={false}>
            <View style={{ width: "50%" }}>
              <Text style={styles.blackBold}>{company.name}</Text>
              <Text style={[styles.blackBold, { marginTop: 4 }]}>{company.designation}</Text>
              <Text style={styles.blueBold}>{company.representative}</Text>
              <Image src="/assets/signature.png" style={{ width: 120, height: 60, objectFit: "contain" }} />
            </View>
            <View style={{ width: "45%", textAlign: "right" }}>
              <Text style={styles.blackBold}>{client.name?.toUpperCase()}</Text>
              <Text style={styles.blueBold}>{client.representative}</Text>
            </View>
          </View>
        </View>
        <CommonFooter />
      </Page>
    </Document>
  );
}
