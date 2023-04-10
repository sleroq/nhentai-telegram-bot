export default interface Doujin {
	id: string;
	url: string;
	pages: string[];
	thumbnail: string;
	title: Title;
	details: {
		parodies: Tag[];
		characters: Tag[];
		tags: Tag[];
		artists: Tag[];
		groups: Tag[];
		languages: Tag[];
		categories: Tag[];
		pages: number;
		uploaded: {
			datetime: Date;
			pretty: string;
		};
	};
}

export interface Source {
	name: string;
	id: string;
	url: string;
}

export interface Tag {
	name: string;
	url: string;
}

export interface Title {
	translated: {
		full: string;
		pretty: string;
	};
	original: {
		full: string;
		pretty: string;
	};
}
